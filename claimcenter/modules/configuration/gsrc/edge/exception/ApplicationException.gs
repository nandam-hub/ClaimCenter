package edge.exception

uses java.lang.Throwable
uses java.lang.RuntimeException

abstract class ApplicationException extends RuntimeException {
  private var _msg: String
  private var _data: Object

  private var _code: ApplicationErrorCode as readonly Code

  override public property get Message(): String {
    if (_msg != null) {
      return "ErrorCode: ${_code.getErrorCode()}-${_code} ErrorMessage: ${_msg}"
    } else {
      return "ErrorCode: ${_code.getErrorCode()}-${_code} ErrorMessage: " + super.Message
    }
  }

  public property set Message(myMsg: String) {
    _msg = myMsg
  }

  public property get Data(): Object {
    return _data
  }

  public property set Data(myData: Object) {
    _data = myData
  }

  protected construct(myCode: ApplicationErrorCode, myMessage: String) {
    this._code = myCode;
    this._msg = myMessage;
  }

  protected construct(myCode: ApplicationErrorCode) {
    this._code = myCode
  }

  protected construct(myCode: ApplicationErrorCode, myCause: Throwable) {
    super(myCause)
    this._code = myCode
  }
}
