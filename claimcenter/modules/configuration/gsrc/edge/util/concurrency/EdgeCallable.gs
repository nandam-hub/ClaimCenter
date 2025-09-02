package edge.util.concurrency

uses java.util.concurrent.Callable
uses edge.PlatformSupport.Logger
uses java.lang.Exception
uses java.lang.RuntimeException

class EdgeCallable implements Callable {

  private static final var LOGGER = new Logger(EdgeCallable.Type.QName)
  var _callFn : CallFn

  construct(callFn : CallFn){
    _callFn = callFn
  }

  override function call(): Object {
    try {
      return _callFn.call()
    } catch (e: Exception) {
      LOGGER.logError(e.LocalizedMessage, e)
      throw new RuntimeException("Failed to execute function call")
    }
  }
}
