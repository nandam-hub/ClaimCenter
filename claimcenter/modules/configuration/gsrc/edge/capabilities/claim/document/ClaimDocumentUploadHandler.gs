package edge.capabilities.claim.document


uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses org.apache.commons.fileupload2.core.FileItem

uses edge.jsonrpc.AbstractRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.claim.local.IClaimRetrievalPlugin
uses gw.api.webservice.exception.BadIdentifierException
uses edge.PlatformSupport.Bundle
uses gw.plugin.Plugins
uses gw.plugin.document.IDocumentContentSource
uses edge.security.authorization.exception.AuthorizationException
uses edge.capabilities.claim.document.dto.ClaimDocumentUploadDTO
uses edge.capabilities.claim.document.dto.ClaimDocumentDTO
uses edge.capabilities.claim.document.IClaimDocumentPlugin
uses edge.security.fileupload.exception.IllegalContentTypeException
uses edge.security.fileupload.IFileUploadPlugin

/**
 * Handler of document uploads.
 * It is needed to work around "security through obscurity" in the authz service and its inability
 * to cope with many different access modes for the same URL. It is also work around for a third-party component
 * which is also inflexible and could not accommodate (use) different transports.
 */
class ClaimDocumentUploadHandler extends AbstractRpcHandler {

  private var _documentPlugin : IClaimDocumentPlugin
  private var _documentSessionPlugin : IDocumentSessionPlugin
  private var _claimRetrievalPlugin : IClaimRetrievalPlugin
  private var _fileUploadPlugin : IFileUploadPlugin

  @InjectableNode
  @Param("documentPlugin", "Plugin used to deal with claim documents")
  @Param("documentSessionPlugin", "Plugin used to deal with document sessions")
  @Param("claimRetrievalPlugin", "Plugin used to access claim data")
  @Param("fileUploadPlugin", "Plugin used to verify file upload validity")
  construct(documentPlugin : IClaimDocumentPlugin,
            documentSessionPlugin : IDocumentSessionPlugin,
            claimRetrievalPlugin : IClaimRetrievalPlugin,
            fileUploadPlugin : IFileUploadPlugin) {
    this._documentPlugin = documentPlugin
    this._documentSessionPlugin = documentSessionPlugin
    this._claimRetrievalPlugin = claimRetrievalPlugin
    this._fileUploadPlugin = fileUploadPlugin
  }

  /**
   * Used to upload claim documents from the frontend.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IDocumentSessionPlugin#isSessionValid(String)</code> - to check if the current document session token is valid in this context.</dd>
   *  <dd><code>IFileUploadPlugin#canUploadContentType(FileItem)</code> - to see if the filetype for the document is allowed by the DMS.</dd>
   *  <dd><code>IClaimRetrievalPlugin#getClaimByNumber(String)</code> - to retrieve the claim.</dd>
   *  <dd><code>IClaimDocumentPlugin#createDocumentMetadata(Bundle, Claim, ClaimDocumentUploadDTO)</code> - to convert DTO into metadata and attach it to the document.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>AuthorizationException</code> - If session is invalid</dd>
   *  <dd><code>IllegalContentTypeException</code> - If the filetype is not permitted by the DMS</dd>
   *  <dd><code>BadIdentifierException</code> - If the claim number does not exist</dd>
   * </dl>
   *
   * @param documentDto a DTO describing the metadata for the document
   * @param documentFile the document itself
   * @returns A claimDocumentDTO for display in the frontend
   * */
  @JsonRpcMethod
  @ApidocMethodDescription("Used to upload claim documents from the frontend.")
  @ApidocAvailableSince("5.0")
  function upload(documentDto:ClaimDocumentUploadDTO, documentFile: FileItem) : ClaimDocumentDTO {
    try {
      try {
        // validate document upload token
        _documentSessionPlugin.getSessionDocumentId(documentDto.SessionID)
      } catch ( ex : JsonRpcSecurityException) {
        throw new AuthorizationException(){:Message = "Unauthorized portal access"}
      }
      if (!_fileUploadPlugin.canUploadContentType(documentFile)) {
        throw new IllegalContentTypeException("Cannot upload files of content type: " + documentFile.ContentType)
      }

      var claim = _claimRetrievalPlugin.getClaimByNumber(documentDto.ClaimNumber)

      if (claim == null) {
        throw new BadIdentifierException("Bad claim number " + documentDto.ClaimNumber)
      }

      final var res = Bundle.resolveInTransaction<Document>(\ bundle -> {
        claim = bundle.add(claim)
        final var doc = _documentPlugin.createDocumentMetadata(bundle, claim, documentDto)
        Plugins.get(IDocumentContentSource).addDocument(documentFile.InputStream, doc)
        return doc
      })

      /* Should do this outside the transactions as public ID is not set inside the bundle. */
      return _documentPlugin.getDocumentDetails(res)
    } finally {
      documentFile.InputStream.close()
    }
  }
}