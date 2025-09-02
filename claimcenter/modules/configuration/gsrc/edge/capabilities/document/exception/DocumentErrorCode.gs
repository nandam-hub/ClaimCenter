package edge.capabilities.document.exception


/**
 * Enumeration of possible document status codes.
 * For each error element defines the relative URL of the HTML document to
 * be shown to the user instead of the document.
 */
enum DocumentErrorCode {
  OK(0, null),
  DOCUMENT_NOT_FOUND(404,"document-not-found.html"),
  CMS_TEMPORARLY_UNAVAILABLE(503, "document-temporarly-unavailable.html"),
  DOCUMENT_NOT_IN_CMS(-2, "document-not-ready.html")
  
  private var _code:int as readonly CheckResult
  private var _errorUrl:String as readonly ErrorUrl
  
  private construct(c:int, url:String) {
    _code = c
    _errorUrl = url
  }
}
  
