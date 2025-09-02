package gw.plugin.document.impl

uses gw.api.system.PLLoggerCategory
uses gw.api.util.DateUtil
uses gw.api.util.RetryableException
uses gw.api.webservice.messagingTools.MessagingToolsImpl
uses gw.plugin.document.IDocumentContentSource
uses gw.plugin.document.IDocumentMetadataSourceBase
uses gw.plugin.InitializablePlugin
uses gw.plugin.messaging.MessageTransport
uses java.lang.Integer
uses java.util.Map

@Export
class DocumentStoreTransport implements MessageTransport, InitializablePlugin {
  static var MAX_RETRIES_PARAM = "MaxRetries"
  static var MAX_RETRIES_DEFAULT = 5
  static var RETRY_MINUTES_PARAM = "RetryMinutes"
  static var RETRY_MINUTES_DEFAULT = 1
  public static var DEST_ID : int = 324
  var _maxRetries : int
  var _retryMinutes : int
  var _destId : int

  override function send( msg: Message, transformedPayload: String ) : void  {
    var document = msg.getMessageRoot() as Document
    PLLoggerCategory.DOCUMENT.info("DST-Sending message id=${msg.ID} for Document:${document.ID} from '${document.PendingDocUID}'")
    var idcs = gw.plugin.Plugins.get( IDocumentContentSource )
    var idms = gw.plugin.Plugins.isEnabled( "IDocumentMetadataSource" )
      ? gw.plugin.Plugins.get( "IDocumentMetadataSource" ) as IDocumentMetadataSourceBase
      : null;
    try {
      if (idcs.addDocument( null, document ) and idms != null) {
        idms.saveDocument( document )
      }
      msg.reportAck()
    } 
    catch (e : RetryableException) {
      document = document.Bundle.loadBean( document.ID ) as Document
      if (msg.RetryCount < _maxRetries) {
        var retryTime = e.SuggestedRetryTime
        if (retryTime == null) {
          retryTime = DateUtil.currentDate().addMinutes( _retryMinutes )
        }
        PLLoggerCategory.DOCUMENT.info("Retry requested for Document:${document.ID} '${document.Name}' will retry again at ${retryTime.format( "HH:mm" )}", e)
        msg.reportError(retryTime)
      } else {
        PLLoggerCategory.DOCUMENT.info("Retry requested for Document:${document.ID} '${document.Name}' exceeding maxRetry will discard.", e)
        document.addEvent( "FailedDocumentStore" )
        msg.reportNonRetryableError()
      }
    }
    catch (e : Throwable) {
      document = document.Bundle.loadBean( document.ID ) as Document
      PLLoggerCategory.DOCUMENT.info("Error processing Document:${document.ID} '${document.Name}'", e)
        document.addEvent( "FailedDocumentStore" )
      msg.reportNonRetryableError()
    }
  }

  override function resume() : void {
    // since communication is through IDCS & IDMS, there is nothing to do here
  }


  override function shutdown() : void {
    // since communication is through IDCS & IDMS, there is nothing to do here
  }

  override function suspend() : void {
    // since communication is through IDCS & IDMS, there is nothing to do here
  }

   override property set DestinationID( destId : int ) : void {
    _destId = destId
     if (_destId != DEST_ID) {
       PLLoggerCategory.DOCUMENT.error("DST-not starting with expected destination id was " + _destId + " expected " + DEST_ID)
     }
  }

 override property set Parameters( params: Map<Object,Object> ) : void {
    _maxRetries = parseAndSetInt(params, MAX_RETRIES_PARAM, MAX_RETRIES_DEFAULT)
    _retryMinutes = parseAndSetInt(params, RETRY_MINUTES_PARAM, RETRY_MINUTES_DEFAULT)
   PLLoggerCategory.DOCUMENT.info("DST-starting with maxRetries=${_maxRetries}, retryMinutes=${_retryMinutes}")
  }

  private function parseAndSetInt(params : Map<Object,Object>, paramName : String, defaultValue : int) : int{
    var valueStr = params.get(paramName) as String
    if (valueStr != null) {
      try {
        return Integer.parseInt( valueStr )
      } catch(e : Throwable) {
      }
    }
    return defaultValue
  }
}
