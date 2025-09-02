package edge.capabilities.document

uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse

/**
 * Base interface for all retrieval handlers.s
 */
interface  IDocumentRetrievalHandler {
  /**
   * Handles document request.
   */
  function doGet(req : HttpServletRequest, resp : HttpServletResponse)
}