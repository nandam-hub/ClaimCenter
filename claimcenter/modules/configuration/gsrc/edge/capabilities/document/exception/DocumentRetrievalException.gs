package edge.capabilities.document.exception

uses java.lang.Exception

class DocumentRetrievalException extends Exception {
  private var _code: DocumentErrorCode as readonly Code

  public construct(aCode: DocumentErrorCode, aMessage: String) {
    super("ErrorCode: ${aCode.CheckResult}-${aCode} ErrorMessage: ${aMessage}")
    _code = aCode
  }
}
