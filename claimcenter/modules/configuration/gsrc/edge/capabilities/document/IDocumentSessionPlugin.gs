package edge.capabilities.document

/**
 * Plugin used to generate document session identifiers.
 */
interface IDocumentSessionPlugin {

  /**
   * Retrieves a new document session for a specific user.
   */
  public function getDocumentSession(documentId : String) : String

  /**
   * Get the expiration time for a document session in minutes
   */
  public property get Expiration() : int
  
  /**
   * Get internal user that was active when the session was created
   */
  public function getSessionUser(sessionUUID: String): User

  /**
   * Checks if a document session is valid and retrieves the
   * documentID
   */
  public function getSessionDocumentId(sess : String) : String
}
