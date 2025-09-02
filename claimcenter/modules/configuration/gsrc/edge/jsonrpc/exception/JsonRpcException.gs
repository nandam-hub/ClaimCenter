package edge.jsonrpc.exception

uses com.fasterxml.jackson.annotation.JsonIgnoreProperties
uses edge.jsonmapper.JsonProperty

uses java.lang.Throwable
uses java.lang.Integer
uses java.lang.IllegalStateException
uses java.lang.Exception

/**
 * Base JSON-RPC 2.0 Exception. NOTE : If extending this class, the JsonIgnoreProperties annotation must be defined on the subclass
 * as Jackson does not pick up the annotation from the superclass.
 */

@JsonIgnoreProperties(:value = {"stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
abstract class JsonRpcException extends Exception {

  private var _id: String as Id
  private var _code: JsonRpcErrorCode as readonly JsonRpcError
  private var _msg: String as Message
  private var _data: JsonRpcExceptionData

  @JsonProperty
  public property get Code(): Integer {
    return _code != null ? _code.getErrorCode() : null
  }

  @JsonProperty
  public property get Data(): JsonRpcExceptionData {
    return _data
  }

  /**
   * Constraining the user to a one time initialization of the data in order
   * to limit the associating the wrong type of exception data with with an exception.
   */
  public property set Data(myData: JsonRpcExceptionData) {
    if (_data == null) {
      _data = myData
    } else {
      throw new IllegalStateException("Unable to set exception data after it has already been set")
    }
  }

  @JsonProperty
  override public property get Message(): String {
    if (_msg != null) {
      return "ErrorCode: ${_code.getErrorCode()}-${_code} ErrorMessage: ${_msg}"
    } else {
      return "ErrorCode: ${_code.getErrorCode()}-${_code} ErrorMessage: " + super.Message
    }
  }

  construct(myCode: JsonRpcErrorCode) {
    this._code = myCode
  }

  construct(myCode: JsonRpcErrorCode, myCause: Throwable) {
    super(myCause)
    this._code = myCode
  }

}
