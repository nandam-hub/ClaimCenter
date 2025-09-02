package gw.surepath.suite.integration.logging

uses gw.api.system.logging.structuredlogger.IStructuredLogger
uses gw.api.system.logging.structuredlogger.LogData
uses gw.api.system.logging.structuredlogger.StructuredLoggerImpl
uses gw.lang.reflect.features.FeatureReference
uses gw.pl.logging.LoggerCategory
uses org.slf4j.Logger
uses org.slf4j.LoggerFactory


/**
 * Wrapper around Logger that formats log messages for consistency.
 * This logger uses Guidewire's Common Logging Format (CLF) and outputs
 * log entries as structured Json
 */
class StructuredLogger extends StructuredLoggerImpl {

  // Static loggers that wrap the existing LoggerCategory loggers
  public static final var PLUGIN : StructuredLogger = new StructuredLogger(LoggerCategory.PLUGIN)
  public static final var MESSAGING : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING)
  public static final var MESSAGING_LEASE : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_LEASE)
  public static final var MESSAGING_LEASE_EVENT : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_LEASE_EVENT)
  public static final var MESSAGING_DESTMGR : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_DESTMGR)
  public static final var MESSAGING_MESSAGE : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_MESSAGE)
  public static final var MESSAGING_PREPROCESSOR : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_PREPROCESSOR)
  public static final var MESSAGING_PREPROCESSOR_NODE : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_PREPROCESSOR_NODE)
  public static final var MESSAGING_PERF : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_PERF)
  public static final var MESSAGING_EXAMPLES : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_EXAMPLES)
  public static final var API : StructuredLogger = new StructuredLogger(LoggerCategory.API)
  public static final var PROFILER : StructuredLogger = new StructuredLogger(LoggerCategory.PROFILER)
  public static final var CONFIG : StructuredLogger = new StructuredLogger(LoggerCategory.CONFIG)
  public static final var TOOLS : StructuredLogger = new StructuredLogger(LoggerCategory.TOOLS)
  public static final var CONFIG_DISPLAY : StructuredLogger = new StructuredLogger(LoggerCategory.CONFIG_DISPLAY)
  public static final var CONFIG_UPGRADER : StructuredLogger = new StructuredLogger(LoggerCategory.CONFIG_UPGRADER)
  public static final var CONFIG_SERVICE : StructuredLogger = new StructuredLogger(LoggerCategory.CONFIG_SERVICE)
  public static final var TEST : StructuredLogger = new StructuredLogger(LoggerCategory.TEST)
  public static final var TEST_DATABASE : StructuredLogger = new StructuredLogger(LoggerCategory.TEST_DATABASE)
  public static final var RULES : StructuredLogger = new StructuredLogger(LoggerCategory.RULES)
  public static final var INTEGRATION : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION)
  public static final var INTEGRATION_WORKAGENT : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION_WORKAGENT)
  public static final var INTEGRATION_MSGREPLY : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION_MSGREPLY)
  public static final var INTEGRATION_JMS : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION_JMS)
  public static final var INTEGRATION_FILE : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION_FILE)
  public static final var INTEGRATION_CUSTOM : StructuredLogger = new StructuredLogger(LoggerCategory.INTEGRATION_CUSTOM)
  public static final var KPI : StructuredLogger = new StructuredLogger(LoggerCategory.KPI)
  public static final var MESSAGING_KPI : StructuredLogger = new StructuredLogger(LoggerCategory.MESSAGING_KPI)
  public static final var KPI_PROFILER : StructuredLogger = new StructuredLogger(LoggerCategory.KPI_PROFILER)
  public static final var IL_CONFIG : StructuredLogger = new StructuredLogger(LoggerCategory.IL_CONFIG)

  //START SurePath Edge Structured Logger
  public static final var EDGE_SP : StructuredLogger = new StructuredLogger(LoggerFactory.getLogger("Edge_SP"));
  //END SurePath Edge Structured Logger

  protected construct(logger : Logger) {
    super(logger)
  }

  /**
   * Determine whether trace logging is enabled.
   *
   * @return true if trace logging is enabled, false if not.
   */
  public property get TraceEnabled() : boolean {
    return super.isTraceEnabled()
  }

  /**
   * Determine whether debug logging is enabled.
   *
   * @return true if debug logging is enabled, false if not.
   */
  public property get DebugEnabled() : boolean {
    return super.isDebugEnabled()
  }

  /**
   * Determine whether info logging is enabled.
   *
   * @return true if info logging is enabled, false if not.
   */
  public property get InfoEnabled() : boolean {
    return super.isInfoEnabled()
  }

  /**
   * Determine whether warn logging is enabled.
   *
   * @return true if warn logging is enabled, false if not.
   */
  public property get WarnEnabled() : boolean {
    return super.isWarnEnabled()
  }

  /**
   * Determine whether error logging is enabled.
   *
   * @return true if error logging is enabled, false if not.
   */
  public property get ErrorEnabled() : boolean {
    return super.isErrorEnabled()
  }

  /**
   * Get the logger category name.
   *
   * @return the logger category name.
   */
  public property get Name() : String {
    return super.getName()
  }

  /**
   * Create a StructuredLogger for a subcategory of this StructuredLogger.
   *
   * @param subcategory the subcategory name.
   * @return a new StructuredLogger.
   */
  public function createSubcategoryLogger(subcategory : String) : StructuredLogger {
    var sublog = LoggerFactory.getLogger(this._logger.Name + "." + subcategory)
    return new StructuredLogger(sublog)
  }

  /**
   * Set logging context and evaluate an operation.
   *
   * @param blk        the operation, which evaluates to type T.
   * @param parameters a map of key/value pairs to add to the logging context.
   * @return the result of the operation.
   */
  public function evaluateWithContext<T extends Object>(blk : block() : T, parameters : Map<String, String>, includeTiming: boolean = false) : Object {
    return evaluateWithLoggingContext(blk, parameters, includeTiming)
  }

  /**
   * Light logging is a lightweight version of the log output intended to be used
   * only for TRACE or INFO messages where you want the very basic info and not all the extended
   * object info. This is mostly intended for use in development where you are tracing or debugging
   * statements.
   * <p>
   * To enable light logging you add a variable to the MDC Logging context called lightLogging.
   * The variable can contain either "true" or "1" and that will cause the logging for INFO and DEBUG
   * to log only the message, userId and serverId.
   *
   * @return true if enabled, false otherwise.
   */
  public function isLightLoggingEnabled() : boolean {
    return isLightLogging()
  }

  /**
   * Should we remove CRLF from before outputting log? Default is false.
   *
   * @return true if you want CRLF removed from log output. The default is false.
   */
  public function isRemoveCRLF() : boolean {
    return isRemoveCRLFCharacters()
  }


  /**
   * Set logging context and execute an operation.
   *
   * @param blk        the operation, which has no return value.
   * @param parameters a map of key/value pairs to add to the logging context.
   */
  public function executeWithContext(blk : block(), parameters : Map<String, String>, includeTiming: boolean = false) {
    executeWithLoggingContext(blk, parameters, includeTiming)
  }

  /**
   * Log a trace message.
   *
   * @param msg         the log message.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param method      an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog    an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function trace(msg : String,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        method : FeatureReference = null,
                        lightLog : boolean = false,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) : LogData {
    if (method != null) {
      var methodInfo = method.FeatureInfo
      return super.logTrace(msg, null, objects, parameters, errorCode, methodInfo.Container.DisplayName, methodInfo.DisplayName, lightLog)
    } else {
      return super.logTrace(msg, null, objects, parameters, errorCode, methodClazz, methodName, lightLog)
    }
  }

  /**
   * Log a debug message.
   *
   * @param msg         the log message.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param method      an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog    an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function debug(msg : String,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        method : FeatureReference = null,
                        lightLog : boolean = false,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) : LogData {
    if (method != null) {
      var methodInfo = method.FeatureInfo
      return super.logDebug(msg, null, objects, parameters, errorCode, methodInfo.Container.DisplayName, methodInfo.DisplayName, lightLog)
    } else {
      return super.logDebug(msg, null, objects, parameters, errorCode, methodClazz, methodName, lightLog)
    }
  }

  /**
   * Log an info message.
   *
   * @param msg         the log message.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param method      an optional reference to the method calling this log statement. There are performance implications due to reflection, so make sure you use this judiciously, as placing this in large loops can affect performance significantly.
   * @param lightLog    an optional boolean which indicates if you want to use lightLogging. Light logging only outputs the message, userId and serverId for when you are doing specific tracing or info messages, to keep the output minimal
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function info(msg : String,
                       objects : List<Object> = null,
                       parameters : Map<String, Object> = null,
                       method : FeatureReference = null,
                       lightLog : boolean = false,
                       errorCode : String = null,
                       methodClazz : String = null,
                       methodName : String = null) : LogData {
    if (method != null) {
      var methodInfo = method.FeatureInfo
      return super.logInfo(msg, null, objects, parameters, errorCode, methodInfo.Container.DisplayName, methodInfo.DisplayName, lightLog)
    } else {
      return super.logInfo(msg, null, objects, parameters, errorCode, methodClazz, methodName, lightLog)
    }
  }


  /**
   * Log a warn message.
   *
   * @param msg         the log message.
   * @param method      a reference to the method calling this log statement.
   * @param ex          an optional Exception.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function warn(msg : String,
                       method : FeatureReference,
                       ex : Exception = null,
                       objects : List<Object> = null,
                       parameters : Map<String, Object> = null,
                       errorCode : String = null,
                       methodClazz : String = null,
                       methodName : String = null) : LogData {
    if (method != null) {
      var methodInfo = method.FeatureInfo
      return super.logWarn(msg, ex, objects, parameters, errorCode, methodInfo.Container.DisplayName, methodInfo.DisplayName)
    } else {
      return super.logWarn(msg, ex, objects, parameters, errorCode, methodClazz, methodName)
    }
  }

  /**
   * Log an error message.
   *
   * @param msg         the log message.
   * @param method      an optional reference to the method calling this log statement.
   * @param ex          an optional Exception.
   * @param objects     an optional list of objects, entities, or BoundPropertyReferences to add to the log message.
   * @param parameters  an optional map of additional key/value pairs to add to the log message.
   * @param errorCode   an optional parameter that allows you to inject a business or error code into the resulting output. This will be found in the variable contextMap and will be under the key "errorCode" in the map. The MDC will also be checked for this in case you set it in MDC.
   * @param methodClazz an optional parameter that is an alternative to passing the feature reference "Method". Using methodClazz and MethodName which are both strings will remove any performance implications in using the parameter "method". Use this in loops, batches and performance sensitive code. The downside however is that any code refactoring will have to remember to update the logging statements.
   * @param methodName  an optional parameter that is an alternative to passing the feature reference "method". Used in combination with methodClazz (see description of methodClazz)
   */
  public function error(msg : String,
                        method : FeatureReference,
                        ex : Exception = null,
                        objects : List<Object> = null,
                        parameters : Map<String, Object> = null,
                        errorCode : String = null,
                        methodClazz : String = null,
                        methodName : String = null) : LogData {
    if (method != null) {
      var methodInfo = method.FeatureInfo
      return super.logError(msg, ex, objects, parameters, errorCode, methodInfo.Container.DisplayName, methodInfo.DisplayName)
    } else {
      return super.logError(msg, ex, objects, parameters, errorCode, methodClazz, methodName)
    }
  }

}