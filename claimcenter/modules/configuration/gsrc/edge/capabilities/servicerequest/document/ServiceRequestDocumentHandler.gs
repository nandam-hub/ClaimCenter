package edge.capabilities.servicerequest.document

uses gw.api.database.Query
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.servicerequest.local.IServiceRequestRetrievalPlugin
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.AbstractRpcHandler
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.security.authorization.Authorizer
uses edge.security.authorization.exception.NoAuthorityException

class ServiceRequestDocumentHandler extends AbstractRpcHandler {
  final private static var _logger = new Logger(Reflection.getRelativeName(ServiceRequestDocumentHandler))

  private var _documentPlugin : IServiceRequestDocumentPlugin
  private var _retrievalPlugin : IServiceRequestRetrievalPlugin
  private var _documentSessionPlugin : IDocumentSessionPlugin
  private var _authz : Authorizer<Document>

  @InjectableNode
  @Param("documentPlugin", "Plugin used to deal with sr documents")
  @Param("documentSessionPlugin", "Plugin used to deal with document sessions")
  @Param("docAuthz", "Authorizer for claim documents")
  public construct(documentPlugin : IServiceRequestDocumentPlugin,
                   documentSessionPlugin : IDocumentSessionPlugin,
                   docAuthz:Authorizer<Document>,
                   retrievalPlugin : IServiceRequestRetrievalPlugin) {
    this._documentPlugin = documentPlugin
    this._documentSessionPlugin = documentSessionPlugin
    this._authz = docAuthz
    this._retrievalPlugin = retrievalPlugin
  }


  /**
   * Deletes document from the backend.
   *
   * </br>
   * Throws -
   * <ul>
   * <li>IllegalArgumentException If claim number is null or empty</li>
   * <li>EntityNotFoundException If no claim is found</li>
   * <li>AuthorizationException If the portal user has no access to the claim or document</li>
   * </ul>
   *
   * @param the service request number
   * @param the public id of the document to be deleted
   * @return returns true if the document has been removed from the backend, false otherwise
   */
  @JsonRpcMethod
  public function removeDocument(serviceRequestID : String, publicID: String) : boolean{
    var serviceRequest = _retrievalPlugin.getServiceRequestFromPublicId(serviceRequestID)
    // get the document with the id and the associated claim
    var doc = serviceRequest.Documents.firstWhere(\d -> d.PublicID == publicID)
    if ( doc != null ) {
      if ( !_authz.canAccess(doc) ) {
        throw new NoAuthorityException()
      }
      _documentPlugin.deleteDocument(serviceRequest, doc)
    }
    return Query.make(Document).compare("PublicID",Equals,publicID).select().Count <= 0
  }

  @JsonRpcMethod
  public function generateUploadToken() : String {
    return _documentSessionPlugin.getDocumentSession("@@TOKEN@@")
  }


}
