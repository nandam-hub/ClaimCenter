package edge.PlatformSupport

uses java.lang.StringBuilder

uses gw.util.GosuStringUtil

uses java.lang.Throwable

class Logger {

  private var _logger = org.slf4j.LoggerFactory.getLogger("Edge")
  private var _classTag: String

  construct(classTag: String) {
    _classTag = classTag
  }


  private function buildLogStringBuilder(msg: String, t: Throwable): StringBuilder {
    var builder = new StringBuilder()
    builder.append(_classTag)
    builder.append(" ")

    if (GosuStringUtil.isNotBlank(msg)) {
      builder.append(msg)
    }

    if (t != null) {
      builder.append(" ").append(Exception.stackTraceAsString(t))
    }

    return builder
  }

  public function logDebug(msg: String) {
    if (debugEnabled()) {
      _logger.debug(buildLogStringBuilder(msg, null).toString())
    }
  }

  public function logDebug(t: Throwable) {
    if (debugEnabled()) {
      _logger.debug(buildLogStringBuilder(null, t).toString())
    }
  }

  public function logDebug(msg: String, t: Throwable) {
    logDebug(msg)
    logDebug(t)
  }

  public function logInfo(msg: String) {
    _logger.info(buildLogStringBuilder(msg, null).toString())
  }

  public function logInfo(t: Throwable) {
    _logger.info(buildLogStringBuilder(null, t).toString())
  }

  public function logError(msg: String) {
    _logger.error(buildLogStringBuilder(msg, null).toString())
  }

  public function logError(t: Throwable) {
    _logger.error(buildLogStringBuilder(null, t).toString())
  }

  public function logError(msg: String, t: Throwable) {
    logError(msg)
    logError(t)
  }

  public function logWarn(msg: String) {
    _logger.warn(buildLogStringBuilder(msg, null).toString())
  }

  public function logWarn(t: Throwable) {
    _logger.warn(buildLogStringBuilder(null, t).toString())
  }

  public function logWarn(msg: String, t: Throwable) {
    logWarn(msg)
    logWarn(t)
  }

  public function debugEnabled(): Boolean {
    return _logger.DebugEnabled
  }

  public static function addRequestId(value : Object) {
    resetInfo()
    if(value != null) {
        org.slf4j.MDC.put("JsonRpcId", value.toString())
    }
  }

  public static function resetInfo(){
    org.slf4j.MDC.remove("JsonRpcId")
  }

}
