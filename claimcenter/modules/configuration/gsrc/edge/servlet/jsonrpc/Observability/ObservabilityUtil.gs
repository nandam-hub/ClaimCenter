package edge.servlet.jsonrpc.Observability

uses com.guidewire.pl.external.configuration.ExternalProperties
uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.databind.DeserializationFeature
uses com.fasterxml.jackson.databind.ObjectMapper
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.servlet.jsonrpc.marshalling.GosuObservabilityModule
uses gw.api.intentionallogging.IntentionalLoggingConfiguration
uses gw.api.observability.ObservabilityContext
uses gw.lang.reflect.IMethodInfo
uses jakarta.servlet.http.HttpServletRequest
uses org.apache.commons.fileupload2.core.DiskFileItem
uses org.slf4j.event.Level
uses org.slf4j.MarkerFactory
uses org.slf4j.MDC

class ObservabilityUtil {

  private static final var MARKER_NAME = IEdgeObservabilityConstants.LOG_MARKER_PORTAL_REQUEST
  private static final var LOGGING_PROPERTY_LEVEL = IEdgeObservabilityConstants.LOGGING_PROPERTY_LEVEL
  private static final var LOGGING_DEFAULT_LEVEL = IEdgeObservabilityConstants.LOGGING_DEFAULT_LEVEL
  private static final var LOGGER = new Logger(Reflection.getRelativeName(ObservabilityUtil))
  private static var _logLevel: Level = null

  public static function isObservabilityEnabled() : boolean {
    return IntentionalLoggingConfiguration.getInstance().isEnabled(MarkerFactory.getMarker(MARKER_NAME))
  }

  public static function getMarkerName() : String {
    return MARKER_NAME
  }

  public static function addReqParams(ctx: ObservabilityContext, methodInfo : IMethodInfo, paramsValues : List<Object>) {
    if (methodInfo != null and paramsValues != null) {
      var paramsNames = methodInfo.getParameters()
      for (param in paramsNames index i) {
        ctx.withContext(param.getName(), getObjectJsonValue(paramsValues.get(i)))
      }
    }
  }

  public static function addResponse(ctx: ObservabilityContext, response: Object) {
    ctx.withContext(IEdgeObservabilityConstants.LOG_TRACEABILITY_RESULT, getObjectJsonValue(response))
  }

  public static function setMDCLogParamsFromRequest(req: HttpServletRequest) {
    for (param in IEdgeObservabilityConstants.B3_HEADERS) {
      setMDCLogParam(param, req.getHeader(param))
    }
  }

  public static function setMDCLogEdgePathFromRequest(path: String) {
    setMDCLogParam(IEdgeObservabilityConstants.LOG_ENDPOINT, path)
  }

  public static function setMDCLogParam(paramName: String, paramValue: String) {
    if (paramValue != null) {
      MDC.put(paramName, paramValue)
    }
  }

  private static function getObjectJsonValue(rawParamValue: Object): String {
    var objectMapper = new ObjectMapper()
    objectMapper.registerModule(GosuObservabilityModule.OBSERVABILITY_INSTANCE)
    objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
    objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)

    if (!(rawParamValue typeis DiskFileItem)) {
      return objectMapper.writeValueAsString(rawParamValue)
    }

    return (rawParamValue as DiskFileItem).getName()
  }

  public static function getLoggingLevel(): Level  {

    if (isLogLevelSet()) return _logLevel

    _logLevel = readLogLevel()
    if (_logLevel == null) {
      _logLevel = LOGGING_DEFAULT_LEVEL
    }
    return _logLevel
  }

  private static function readLogLevel() : Level {
    var logLevel: Level
    var configurationProvider = ExternalProperties.getCurrentProvider()

    try{
      logLevel = Level.valueOf(ExternalProperties.getCurrentProvider().lookupValue('edge', LOGGING_PROPERTY_LEVEL, configurationProvider.getLatestVersion()))
    } catch(e) {
      LOGGER.logError(e)
    } finally {
      LOGGER.resetInfo()
    }

    return logLevel
  }

  private static function isLogLevelSet() : boolean {
      return (_logLevel != null) ? true : false
  }
}