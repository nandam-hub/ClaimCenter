package edge.capabilities.servicerequest.document

uses edge.util.mapping.Mapper
uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.document.util.DocumentUtil
uses gw.document.DocumentsUtil
uses edge.PlatformSupport.Bundle

uses edge.security.authorization.exception.NoAuthorityException
uses edge.capabilities.document.dto.DocumentUploadDTO
uses gw.webservice.cc.cc1000.vendormanagement.ServiceRequestAPI
uses gw.webservice.cc.cc1000.vendormanagement.DocumentContent
uses gw.api.database.Query

class DefaultServiceRequestDocumentPlugin implements IServiceRequestDocumentPlugin{

  private var _sessionProvider : IDocumentSessionPlugin
  private var _documentAuthorizer : Authorizer<Document>
  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _mapper : Mapper as readonly Mapper

  @ForAllGwNodes
  @Param("sessionProvider", "Session provider for document access")
  @Param("documentAuthorizer", "Document authorization logic")
  construct(sessionProvider : IDocumentSessionPlugin, authzProvider:IAuthorizerProviderPlugin, aUserProvider:EffectiveUserProvider) {
    this._sessionProvider = sessionProvider
    this._documentAuthorizer = authzProvider.authorizerFor(Document)
    this._userProvider = aUserProvider
    this._mapper = new Mapper(authzProvider)
  }


  override function mapDocuments(srds :Document[]) : ServiceRequestDocumentDTO[]{
    return Mapper.mapArray(srds,\ m -> toDTO(m))
  }

  override function toDTO(doc : Document) : ServiceRequestDocumentDTO{
    ensureAccess(doc)
    final var res = new ServiceRequestDocumentDTO()
    DocumentUtil.fillDocumentBase(res, doc)
    res.SessionID = _sessionProvider.getDocumentSession(doc.PublicID)
    res.ServiceRequestId = doc.RelatedServiceRequests.first().PublicID//for now.

    return res
  }

  override function deleteDocument(req : ServiceRequest, document : Document) {
    ensureAccess(document)
    if (!canDelete(document)) {
      throw new NoAuthorityException()
    }
    DocumentsUtil.deleteDocument(document)
  }

  /**
   * "Delete" access check for the user and document.
   */
  protected function canDelete(doc : Document) : Boolean {
    return _documentAuthorizer.canAccess(doc) && doc.Author == UserProvider.EffectiveUser.Username
  }


  /**
   * Ensures that user have an access to the given document.
   */
  final function ensureAccess(doc : Document) {
    if (!_documentAuthorizer.canAccess(doc)) {
      throw new NoAuthorityException()
    }
  }

  override function createDocumentMetadata(bundle : Bundle, serviceRequest : ServiceRequest, req : ServiceRequestDocumentDTO, docContent : DocumentContent) : Document {
    if (!perm.Document.create) {
      throw new NoAuthorityException()
    }
    final var docUpload = new DocumentUploadDTO(){
      :Name = req.Name,
      :Description = req.Description,
      :MimeType = req.MimeType,
      :SessionID = req.SessionID
    }

    final var docId = new ServiceRequestAPI().addDocument(serviceRequest.Specialist.AddressBookUID,
        serviceRequest.ServiceRequestNumber,
        docContent,
        req.Name)

    final var q = Query.make(Document)
    q.compare("PublicID",Equals, docId)
    final var res = bundle.add(q.select().AtMostOneRow)

    DocumentUtil.fillDocumentWithDefaults(res, docUpload)
    res.Type = typekey.DocumentType.TC_LETTER_RECEIVED
    res.SecurityType = DocumentSecurityType.TC_UNRESTRICTED
    res.Author = UserProvider.EffectiveUser.Username

    return res
  }
}
