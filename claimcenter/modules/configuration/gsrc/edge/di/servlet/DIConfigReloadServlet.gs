package edge.di.servlet

uses jakarta.servlet.http.HttpServlet
uses gw.servlet.Servlet
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses java.lang.Throwable
uses edge.di.HandlerInfoLookup
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.servlet.EdgeServletUtil
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.system.server.ServerModeUtil
uses edge.servlet.jsonrpc.marshalling.GosuModule

/**
 * Servlet for reloading edge JsonRpcServlets (and other edge configuration data).
 */
@Servlet("/edge-dev/reload-config")
class DIConfigReloadServlet extends HttpServlet {

  final private static var _logger = new Logger(Reflection.getRelativeName(DIConfigReloadServlet))

  override function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    throwIfDisabled()

    resp.setCharacterEncoding("UTF-8")
    resp.setContentType("text/plain")
    EdgeServletUtil.setNoCacheHeaders(resp)

    try {
      final var status = HandlerInfoLookup.reloadHandlerConfiguration()
      if (status.isLeft) {
        resp.Writer.println("FAILED TO RELOAD CONFIGURATION")
        status.left.each( \ elt -> resp.Writer.println(elt))
      } else {
        GosuModule.INSTANCE.resetDeserializers()
        resp.Writer.println("RELOADING DONE")
        resp.Writer.println("Document handlers: " + status.right.DocumentHandlerCount)
        resp.Writer.println("JsonRpc handlers: " + status.right.JsonRpcHandlerCount)
      }
    } catch (e : Throwable) {
      resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR)
      resp.Writer.println("FATAL RELOADING ERROR:")
      _logger.logError(e)
      _logger.logError(resp.Writer.toString())
    }
  }

  function throwIfDisabled() {
    if (not (ServerModeUtil.isDev() || ServerModeUtil.isTest())) {
      throw new JsonRpcSecurityException()
    }
  }
}