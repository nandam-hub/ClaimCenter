package edge.jsonrpc.exception

/**
 * See http://www.jsonrpc.org/specification#error_object
 * 
 * Indicates -32768 to -32000 are reserved for pre-defined errors. 
 * The remainder of the space is available for application defined errors.
 */
enum JsonRpcErrorCode {
  
  PARSE_ERROR(-32700),
  INVALID_REQUEST(-32600),
  METHOD_NOT_FOUND(-32601),
  INVALID_PARAMS(-32602),
  INTERNAL_ERROR(-32603),
  APPLICATION_ERROR(-32500),
  AUTHENTICATION_ERROR(-32501),
  SYSTEM_ERROR(-32400),
  TRANSPORT_ERROR(-32300)
  
  private var _code : int 

  private construct(errorCode : int) {
    _code = errorCode
  }
  
  public function getErrorCode() : int{
    return _code
  }
}
