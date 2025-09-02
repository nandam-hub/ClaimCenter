package edge.exception

uses java.lang.Throwable

class EntityPermissionException extends ApplicationException{

  private var _showExceptionData:boolean as ShowExceptionData = false

  construct(){
    super(ApplicationErrorCode.GW_ENTITY_PERMISSION_ERROR)
  }

  construct(myCause: Throwable){
    super(ApplicationErrorCode.GW_ENTITY_PERMISSION_ERROR, myCause)
  }

  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }
}
