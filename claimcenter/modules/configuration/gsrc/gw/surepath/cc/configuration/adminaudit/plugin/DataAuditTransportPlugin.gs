package gw.surepath.cc.configuration.adminaudit.plugin

uses gw.api.util.DateUtil
uses gw.plugin.InitializablePlugin
uses gw.plugin.messaging.MessageTransport
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Message transport implementation which, possibly sends {@link DataAudit_SP} records
 * to an external system
 */
@IncludeInDocumentation
class DataAuditTransportPlugin implements MessageTransport, InitializablePlugin {

  private var _maxRetryCount : Integer
  private var _retryDelayMultiplier : Integer

  private static var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.DisplayName)
  private static var _maxRetryParamName = "maxRetries"
  private static var _retryDelayMultiplierParamName = "retryDelayMultiplier"

  override function send(message : Message, transformedPayload : String) {
    try {
      _logger.debug("Sending Audit Record to External System", {message.MessageRoot.PublicID})
      _logger.executeWithContext(
          \-> sendMessage(message, transformedPayload),
          {"AuditRecord" -> message.PublicID}
      )
      message.reportAck()
    } catch (e : Exception) {
      handleError(e, message)
    }
  }

  /**
   * Method to be overridden to perform the sending of this message to the external system
   * @param message the message to send
   * @param payload the generated payload
   */
  @IncludeInDocumentation
  protected function sendMessage(message : Message, transformedPayload : String){
    // implement logic to transfer to external system
  }

  override function shutdown() {
    _logger.info("Shutting down Data Audit Transport")
  }

  override function suspend() {
    _logger.info("Suspending Data Audit Transport")
  }

  override function resume() {
    _logger.info("Resuming Data Audit Transport")
  }

  override property set DestinationID(destinationID : int) {
    _logger.info("Setting Destination ID for Data Audit Transport", {destinationID})
  }

  /**
   * Handles errors which occurred during message send
   * @param error the error which occurred
   * @param message the message to send
   */
  private function handleError(exception : Exception, message : Message){
    _logger.warn(exception.Message, DataAuditTransportPlugin#send(Message, String), exception, {message})
    message.ErrorDescription = exception.Message
    if (message.RetryCount > _maxRetryCount) {
      _logger.error("Audit Record failed to send", DataAuditTransportPlugin#send(Message, String), exception, {message})
      message.reportError(ErrorCategory.TC_DATAAUDIT_ERR_SP)
    } else {
      var retryTime = DateUtil.currentDate().addMinutes(message.RetryCount * _retryDelayMultiplier)
      message.reportError(retryTime)
      _logger.warn("Message automatically set to retry", DataAuditTransportPlugin#send(Message, String),
          exception, {message})
    }
  }

  /**
   * Sets internal parameters defined in the plugin
   * @param map map of parameters to set
   */
  override property set Parameters(map : Map) {
    var maxRetries = map.get(_maxRetryParamName) as String
    if (maxRetries != null and maxRetries.Numeric) {
      _maxRetryCount = Integer.parseInt(maxRetries)
    }
    var retryMiltiplier = map.get(_retryDelayMultiplierParamName) as String
    if (retryMiltiplier != null and retryMiltiplier.Numeric) {
      _retryDelayMultiplier = Integer.parseInt(retryMiltiplier)
    }
  }
}