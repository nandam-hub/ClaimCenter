package edge.jsonrpc.exception

uses java.lang.Throwable
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
final class JsonRpcMethodNotFoundException extends JsonRpcException {

  construct(){
    super(JsonRpcErrorCode.METHOD_NOT_FOUND)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.METHOD_NOT_FOUND, myCause)
  }

}
