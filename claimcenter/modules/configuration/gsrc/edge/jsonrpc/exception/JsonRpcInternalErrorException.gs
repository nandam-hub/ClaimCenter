package edge.jsonrpc.exception

uses java.lang.Throwable
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
final class JsonRpcInternalErrorException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.INTERNAL_ERROR)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.INTERNAL_ERROR, myCause)
  }
}
