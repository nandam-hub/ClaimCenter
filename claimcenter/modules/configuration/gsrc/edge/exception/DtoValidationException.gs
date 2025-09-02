package edge.exception
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

class DtoValidationException extends ApplicationException {
  
  private var _showExceptionData:boolean as ShowExceptionData = false

  construct(){
    super(ApplicationErrorCode.GW_DTO_VALIDATION_ERROR)
  }
  
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_DTO_VALIDATION_ERROR, myCause)
  }
  
  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
}
