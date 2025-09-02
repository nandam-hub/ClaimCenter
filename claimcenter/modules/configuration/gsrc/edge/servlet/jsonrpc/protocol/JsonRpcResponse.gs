package edge.servlet.jsonrpc.protocol

uses edge.jsonmapper.JsonProperty
uses edge.jsonrpc.exception.JsonRpcException
uses java.lang.IllegalArgumentException

/**
 * Represents a JSON-RPC 2.0 response.
 */
final class JsonRpcResponse {

  @JsonProperty
  private var _result : Object as readonly Result
  
  @JsonProperty
  private var _error : JsonRpcException as readonly Error
  
  @JsonProperty
  private var _id : Object as readonly Id
  
  @JsonProperty
  public property get Jsonrpc() : String {
    return "2.0" 
  }
    
  /**
   * Create a new JSON-RPC 2.0 response to a successful request
   * 
   * @param myResult The result. The value can map to any JSON type. May be null
   * @param myId The resuest identifier echoed back to the caller. May be null though not recommended
   */
  construct(final myResult : Object, final myId : Object) {
    setResult(myResult)
    setID(myId) 
  }
  
  /**
   * Create a new JSON-RPC 2.0 response to a successful request which result is null
   * 
   * @param myId The request identifier echoed back to the caller. May be null though not recommended 
   */
  construct(final myId : Object){
    setResult(null)
    setID(myId)
  }
  
  /**
   * Creates a new JSON-RPC 2.0 response to a failed request
   * 
   * @param myError A JSON-RPC 2.0 error instance indicating the cause of the failure. Must be non null
   * @param myId The request identifier echoed back to the caller. May be null though not recommended 
   */
  construct(final myError : JsonRpcException, final myId : Object){
    setError(myError)
    setID(myId)
  }
  
  /**
   * Sets the request identifier echoed back to the caller
   * 
   * @param myId The value must map to a JSON scalar
   */
  private function setID(final myId : Object){
    if(myId != null && !(myId typeis Boolean) && !(myId typeis Number) && !(myId typeis String)){
      throw new IllegalArgumentException("The request identifier must map to a JSON scalar")
    }
    _id = myId
  }

  /**
   * Indicates a successful JSON-RPC 2.0 request andd sets the result
   * 
   * @param myResult The result. The value can map to any JSON type. May be null
   */
  private function setResult(final myResult : Object){
    // the result and error are mutually exclusive
    _result = myResult != null ? myResult : new Object() // Set empty object if the result is null to comply with JSON-RPC 2.0 spec
    _error = null
  }
  
  /**
   * Indicates a failed JSON-RPC 2.0 request and sets the error details
   * 
   * @param myError A JSON-RPC 2.0 error instance indicating the cause of the failure
   */
  private function setError(final myError : JsonRpcException){
    if(myError == null){
      throw new IllegalArgumentException("The error object cannot be null") 
    }
    // result and error are mutually exclusive
    _error = myError
    _result = null
  }
  
  
  /**
   * A convience method to check if the response indicates success or failure of the request
   * 
   * @return True if the request succeeded, false if there was an error
   */
  public function indicatesSuccess() : boolean{
    if(_error == null){
      return true 
    }else{
      return false 
    }
  }
  
}
