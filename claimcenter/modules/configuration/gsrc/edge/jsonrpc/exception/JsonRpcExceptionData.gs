package edge.jsonrpc.exception

uses edge.jsonmapper.JsonProperty
uses edge.exception.ApplicationErrorCode

class JsonRpcExceptionData {

  private var _code: ApplicationErrorCode as readonly AppError
  
  @JsonProperty
  public property get AppErrorCode(): int{
    return _code != null ? _code.getErrorCode() : null
  }
  @JsonProperty
  private var _data: Object as AppData
  
  construct(){}
  
  construct(appCode: ApplicationErrorCode){
    _code = appCode
  }
  
  public static function newExceptionData(final data: Object): JsonRpcExceptionData{
    return new JsonRpcExceptionData(){
      :AppData = data
    }
  }
  
  public static function newExceptionData(final code: ApplicationErrorCode, final data: Object): JsonRpcExceptionData{
    return new JsonRpcExceptionData(code){
      :AppData = data
    }
  }
  
}
