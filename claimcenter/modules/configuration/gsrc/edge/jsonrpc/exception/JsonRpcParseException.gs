package edge.jsonrpc.exception

uses java.lang.Throwable
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
final class JsonRpcParseException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.PARSE_ERROR)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.PARSE_ERROR, myCause)
  }
}
