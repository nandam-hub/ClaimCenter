package edge.jsonrpc.exception

uses java.lang.Throwable
uses edge.exception.ApplicationException
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
class JsonRpcApplicationException extends JsonRpcException{

  construct(){
    super(JsonRpcErrorCode.APPLICATION_ERROR)
  }
  
  construct(myCause: Throwable){
    super(JsonRpcErrorCode.APPLICATION_ERROR, myCause)
  }
  
  construct(appExp: ApplicationException){
    super(JsonRpcErrorCode.APPLICATION_ERROR)
    Message = appExp.Message
    Data = new JsonRpcExceptionData(appExp.Code){
      :AppData = appExp.Data
    }
  }
}
