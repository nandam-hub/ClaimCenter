package edge.jsonrpc.exception
uses edge.exception.ApplicationErrorCode
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
class JsonRpcAuthenticationException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.AUTHENTICATION_ERROR)
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_AUTHENTICATION_ERROR)
  }
}
