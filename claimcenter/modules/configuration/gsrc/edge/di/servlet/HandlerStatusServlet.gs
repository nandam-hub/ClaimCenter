package edge.di.servlet

uses gw.servlet.Servlet
uses jakarta.servlet.http.HttpServlet
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses edge.di.HandlerInfoLookup
uses edge.servlet.EdgeServletUtil

/**
 * Servlet for reloading edge JsonRpcServlets (and other edge configuration data).
 */
@Servlet("/edge-dev/handler-status")
class HandlerStatusServlet extends HttpServlet {
  override function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    resp.setCharacterEncoding("UTF-8")
    resp.setContentType("text/plain")
    EdgeServletUtil.setNoCacheHeaders(resp)

    final var status = HandlerInfoLookup.Status

    if (status.isLeft) {
      resp.Writer.println("CONFIGURATION ERRORS FOUND")
      status.left.each( \ elt -> resp.Writer.println(elt))
    } else {
      resp.Writer.println("OK")
      resp.Writer.println("Document handlers: " + status.right.DocumentHandlerCount)
      resp.Writer.println("JsonRpc handlers: " + status.right.JsonRpcHandlerCount)
    }
  }
}