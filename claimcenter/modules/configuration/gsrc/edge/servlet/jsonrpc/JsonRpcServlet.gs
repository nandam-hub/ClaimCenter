package edge.servlet.jsonrpc

uses com.guidewire.pl.external.configuration.ExternalProperties
uses edge.PlatformSupport.Locale
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.di.HandlerInfoLookup
uses edge.jsonrpc.exception.JsonRpcAuthenticationException
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses edge.servlet.EdgeServletUtil
uses edge.servlet.jsonrpc.Observability.ObservabilityUtil
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses gw.api.profiler.ProfilerTag
uses gw.api.profiler.WebServiceProfiler
uses gw.api.webservice.exception.LoginException
uses gw.api.webservice.login.LoginAPIHelper
uses gw.pl.external.configuration.ExternalConfigurationProvider
uses gw.plugin.security.InvalidAuthenticationSourceData
uses gw.servlet.Servlet
uses jakarta.servlet.http.HttpServlet
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses jakarta.xml.ws.http.HTTPException
uses org.slf4j.MDC

@Servlet(\ path : String -> path.matches("/edge/(?!document(/.*)?)(.*)")) // /edge/document is used for retrieving documents
class JsonRpcServlet extends HttpServlet {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(JsonRpcServlet))
  final private static var PROFILER_TAG = new ProfilerTag("JSON_RPC method")

  /**
   *  Handles the POST calls to the servlet
   *
   * @param req The HttpServletRequest object
   * @param resp The HttpServletResposne object
   */
  override function doPost(req: HttpServletRequest, resp: HttpServletResponse){
    req.CharacterEncoding = "UTF-8"
    resp.CharacterEncoding = "UTF-8"

    if (not req.Cookies?.hasMatch(\cookie -> cookie.Name == "JSESSIONID")) {
      resp.addHeader("Set-Cookie", "JSESSIONID=${UUID.randomUUID().toString()}; Path=/; Max-Age=3600")
    }

    var path = req.PathInfo
    MDC.clear()
    ObservabilityUtil.setMDCLogParamsFromRequest(req) //Add params from the request header to be logged (traceability)
    if(path.startsWith("/unauthenticated")) {
      path = req.getAttribute(JsonRpcUnauthenticatedServlet.HANDLER_LOOKUP_REQ_PATH) as String
    }

    Locale.runWithLocale(EdgeServletUtil.retrieveRequestLocale(req), \-> {
      final var handler = HandlerInfoLookup.Instance.JsonRpcProcessors.get(path)
      if (handler != null) {
        ObservabilityUtil.setMDCLogEdgePathFromRequest(path)
        handler.handleCall(req, resp)
        return
      }

      final var e = new JsonRpcInvalidParamsException() {:Message = "No matching handler found for path :" + req.PathInfo}
      LOGGER.logError(e)
      JsonRpcResponder.setErrorResponse(resp, e, "1")
    })
  }

  override protected function service(req : HttpServletRequest, resp : HttpServletResponse) {
    var profiler = new WebServiceProfiler("edge.servlet.jsonrpc.JsonRpcServlet", "service", null);
    if(profiler.isProfilingEnabled()){
      try {
        profiler.maybeEnterProfiling();
        PROFILER_TAG.execute( \-> doServiceCall(req, resp))
      } finally {
        profiler.maybeExitProfiling()
      }
    } else {
      doServiceCall(req, resp)
    }
  }

  private function doServiceCall(req : HttpServletRequest, resp : HttpServletResponse) {
    var configurationProvider : ExternalConfigurationProvider = ExternalProperties.getCurrentProvider();
    var isEdgeAPIEnabled = configurationProvider.lookupValue('edge', 'edgeAPI.enabled', configurationProvider.getLatestVersion());
    if (Boolean.parseBoolean(isEdgeAPIEnabled) == true) {
      try {
        LoginAPIHelper.login(req)
      } catch (e : LoginException) {
        LOGGER.logError(e)
        var exc = new JsonRpcAuthenticationException()
        JsonRpcResponder.setErrorResponse(resp, exc, "1")
        return
      } catch (e : InvalidAuthenticationSourceData) {
        LOGGER.logError(e)
        var exc = new JsonRpcAuthenticationException()
        JsonRpcResponder.setErrorResponse(resp, exc, "1")
        return
      }
      try {
        super.service(req, resp)
      } finally {
        req.Session.invalidate()
        MDC.clear()
      }
    }
    else {
      LOGGER.logError("API call made to edge layer while edge layer is disabled")
      throw new HTTPException(404);
    }
  }
}