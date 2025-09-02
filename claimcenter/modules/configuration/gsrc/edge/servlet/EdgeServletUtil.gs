package edge.servlet

uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse

/** Miscellaneous utilities for Edge servlets. */
class EdgeServletUtil {
  static function retrieveRequestLocale(req: HttpServletRequest) : String {
    var lang = req.getHeader("Accept-Language")
    if ( lang != null )  {
      lang = lang.replace("-","_")
    }
    return lang
  }

  static function setNoCacheHeaders(resp: HttpServletResponse) {
    resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    resp.setHeader("Pragma", "no-cache")
    resp.setHeader("Expires", "0")
  }
}