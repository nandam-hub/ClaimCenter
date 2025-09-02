package edge.oauth.authplugin.dto

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

class JwtProcessingException extends ApplicationException{
  private var _showExceptionData:boolean as ShowExceptionData = false

  construct(){
    super(ApplicationErrorCode.GW_JWT_PROCESS_ERROR)
  }

  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_JWT_PROCESS_ERROR, myCause)
  }

  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
}
