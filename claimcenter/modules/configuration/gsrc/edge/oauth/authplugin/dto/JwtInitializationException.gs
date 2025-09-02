package edge.oauth.authplugin.dto

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

class JwtInitializationException extends ApplicationException {

  private var _showExceptionData:boolean as ShowExceptionData = true

  construct(){
    super(ApplicationErrorCode.GW_JWT_PROCESSOR_INITIALIZATION_ERROR)
  }

  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_JWT_PROCESSOR_INITIALIZATION_ERROR, myCause)
  }

  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
}
