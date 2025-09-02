package edge.servlet

uses edge.PlatformSupport.Locale
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.di.HandlerInfoLookup
uses edge.servlet.jsonrpc.Observability.IEdgeObservabilityConstants
uses edge.servlet.jsonrpc.Observability.ObservabilityUtil
uses gw.api.observability.ObservabilityContext
uses gw.api.observability.ObservabilityHandler
uses gw.api.webservice.exception.LoginException
uses gw.api.webservice.login.LoginAPIHelper
uses gw.plugin.security.InvalidAuthenticationSourceData
uses gw.servlet.Servlet
uses jakarta.servlet.http.HttpServlet
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses org.slf4j.MarkerFactory

@Servlet(\path: String -> path.matches("/edge/document(/.*)?"))
class DocumentDownloadServlet extends HttpServlet {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(DocumentDownloadServlet))

  override function doGet(req: HttpServletRequest, resp: HttpServletResponse) {

    Locale.runWithLocale(EdgeServletUtil.retrieveRequestLocale(req), \-> {
      final var capSlash = req.PathInfo.indexOf("/", HandlerInfoLookup.DOC_PATH_PREFIX.length())

      var observabilityHandler = initObservability(req)

      if (capSlash < 0) {
        resp.sendError(404)
        handleObservabilityError(observabilityHandler)
        return
      }

      final var hSlash = req.PathInfo.indexOf("/", capSlash + 1)
      if (hSlash < 0) {
        resp.sendError(404)
        handleObservabilityError(observabilityHandler)
        return
      }

      final var path = req.PathInfo.substring(0, hSlash)
      final var handler = HandlerInfoLookup.Instance.DocumentDownloadHandlers.get(path)
      if (handler == null) {
        resp.sendError(404)
        handleObservabilityError(observabilityHandler)
      } else {
        handler.doGet(req, resp)
        handleObservabilityCompletion(observabilityHandler)
      }
    })
  }

  override protected function service(req: HttpServletRequest, resp: HttpServletResponse) {
    try {
      LoginAPIHelper.login(req)
    } catch (e: LoginException) {
      LOGGER.logError(e)
      resp.sendError(401)
      return
    } catch (e: InvalidAuthenticationSourceData) {
      LOGGER.logError(e)
      resp.sendError(401)
      return
    }
    try {
      super.service(req, resp)
    } finally {
      req.Session.invalidate()
    }
  }

  override function doPost(req: HttpServletRequest, resp: HttpServletResponse) {
    resp.sendError(405)
  }

  private function initObservability(req: HttpServletRequest) : ObservabilityHandler {
    var observabilityHandler: ObservabilityHandler
    if (ObservabilityUtil.isObservabilityEnabled()) {
      ObservabilityUtil.setMDCLogParamsFromRequest(req)
      var observabilityContext = new ObservabilityContext().withContext("PathInfo", req.getPathInfo()).withOverriddenLogLevel(ObservabilityUtil.getLoggingLevel())
      observabilityHandler = new ObservabilityHandler.Builder()
          .withContext(observabilityContext)
          .build(MarkerFactory.getMarker(IEdgeObservabilityConstants.LOG_MARKER_PORTAL_REQUEST).getName())
    }
    return observabilityHandler
  }

  private function handleObservabilityError(handler: ObservabilityHandler) {
    if ((handler != null) && ObservabilityUtil.isObservabilityEnabled()) {
      handler.getObservabilityContext().withContext("Error", "404")
      handler.fail()
      handler.close()
    }
  }

  private function handleObservabilityCompletion(handler: ObservabilityHandler) {
    if ((handler != null) && ObservabilityUtil.isObservabilityEnabled()) {
      handler.complete()
      handler.close()
    }
  }
}