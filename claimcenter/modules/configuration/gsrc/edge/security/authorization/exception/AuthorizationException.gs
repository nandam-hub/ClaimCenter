package edge.security.authorization.exception

uses edge.exception.ApplicationErrorCode
uses edge.exception.ApplicationException
uses edge.security.EffectiveUser
uses java.lang.Throwable
uses java.lang.StringBuilder

class AuthorizationException extends ApplicationException {
  
  private var _showExceptionData:boolean as ShowExceptionData = false
  
  construct(){
    super(ApplicationErrorCode.GW_SECURITY_ERROR)
  }
  
  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_SECURITY_ERROR, myCause)
  }
  
  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
  
  public static function buildStringMessage(e : AuthorizationException, portalUser: EffectiveUser) : String{
    var sBuilder = new StringBuilder()
    if(e.Message.HasContent){
      sBuilder.append(e.Message)
    }else{
      sBuilder.append("Failed Authorization")
    }
    if(portalUser != null){
      sBuilder.append(" for user ")
      sBuilder.append(portalUser)
    }else{
      sBuilder.append(" no portal user set ")
    }
    return sBuilder.toString()
  }
}
