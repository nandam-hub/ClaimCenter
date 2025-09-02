package edge.jsonrpc.exception

uses java.lang.Throwable
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
final class JsonRpcInvalidParamsException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.INVALID_PARAMS)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.INVALID_PARAMS, myCause)
  }
}
