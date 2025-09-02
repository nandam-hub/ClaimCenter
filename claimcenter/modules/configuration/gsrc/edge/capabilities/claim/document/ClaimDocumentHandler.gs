package edge.capabilities.claim.document

uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.AbstractRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.security.authorization.Authorizer
uses edge.capabilities.document.util.DocumentUtil
uses edge.security.authorization.exception.NoAuthorityException

/**
 * Handler for claim documents.
 */
class ClaimDocumentHandler extends AbstractRpcHandler {
  
  private var _documentPlugin : IClaimDocumentPlugin
  private var _documentSessionPlugin : IDocumentSessionPlugin
  private var _authz : Authorizer<Document>


  @InjectableNode
  @Param("documentPlugin", "Plugin used to deal with claim documents")
  @Param("documentSessionPlugin", "Plugin used to deal with document sessions")
  @Param("docAuthz", "Authorizer to allow access to claim documents")
  construct(documentPlugin : IClaimDocumentPlugin,
      documentSessionPlugin : IDocumentSessionPlugin,
      docAuthz:Authorizer<Document>) {
    this._documentPlugin = documentPlugin
    this._documentSessionPlugin = documentSessionPlugin
    this._authz = docAuthz
  }

  /**
  * Generates a document upload token for use by the frontend.
  *
  * <dl>
  *   <dt>Calls:</dt>
   *   <dd><code>IDocumentSessionPlugin#getDocumentSession()</code> - Obtains the session token.</dd>
  * </dl>
  *
  * @returns A document upload session token.
  * */
  @JsonRpcMethod
  @ApidocMethodDescription("Generates a document upload token for use by the frontend.")
  @ApidocAvailableSince("5.0")
  public function generateUploadToken() : String {
    return _documentSessionPlugin.getDocumentSession("@@TOKEN@@")
  }


  /**
   * Deletes a document in the DMS.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>IClaimDocumentPlugin#deleteDocument(Document)</code> - Removes the document.</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>DocumentRetrievalException</code> - If the document is unavailable.</dd>
   *   <dd><code>NoAuthorityException</code> - If the user is not authorized to access the document.</dd>
   * </dl>
   *
   * @param claimId A String representing the claim's publicID
   * @param publicID A String representing the document's publicID
   * @returns A Boolean indicating success or failure.
   * */
  @JsonRpcMethod
  @ApidocMethodDescription("Deletes a document in the DMS.")
  @ApidocAvailableSince("5.0")
  public function removeDocument(claimId : String, publicID: String) : Boolean {
    var doc = DocumentUtil.getDocumentByPublicId(publicID)
    if (!_authz.canAccess(doc)) {
      throw new NoAuthorityException()
    }
    _documentPlugin.deleteDocument(doc)
    return true
  }


}
