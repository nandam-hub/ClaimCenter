package edge.capabilities.document

uses gw.document.DocumentContentsInfo



/**
 * Plugin used to access document content.
 */
interface IDocumentContentPlugin {
  /**
   * Retrieves document content for a given document
   */
  public function getDocumentContents(doc : Document) : DocumentContentsInfo
}
