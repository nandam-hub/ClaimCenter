package edge.jsonrpc.exception

uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable
uses edge.exception.ApplicationException
uses com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties(:value = {"cause", "stackTrace", "localizedMessage", "suppressed", "jsonRpcError"})
class JsonRpcSessionTimeoutException extends JsonRpcApplicationException{

  construct(){
    super()
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_SESSION_TIMEOUT)
  }
  
  construct(myCause: Throwable){
    super(myCause)
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_SESSION_TIMEOUT)
  }
  
  construct(appExp: ApplicationException){
    super(appExp)
    Data = new JsonRpcExceptionData(ApplicationErrorCode.GW_SESSION_TIMEOUT)
  }

}
