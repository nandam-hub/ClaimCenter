package edge.capabilities.document.dto


/**
 * Information required to fetch a document.
 */
final class DocumentReferenceDTO {
  
  /**
   * Document session identifier.
   */
  var _documentId : String as readonly DocumentId
  
  /**
   * Document session identifier.
   */
  var _session : String as readonly SessionId

  /**
   * Creates a new document reference.
   */
  @Param("id", "Document identifier")
  @Param("sess", "Session identifier")
  construct(id : String, sess : String) {
    this._documentId = id
    this._session = sess
  }
}
