package edge.exception
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

/**
 * Throw when either the state of a dto or entity is in some sort of illegal state.
 */
class IllegalStateException extends ApplicationException {
  
  private var _showExceptionData:boolean as ShowExceptionData = false

  construct(){
    super(ApplicationErrorCode.GW_ILLEGAL_STATE_ERROR)
  }
   
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_ILLEGAL_STATE_ERROR, myCause)
  }
  
  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
}
