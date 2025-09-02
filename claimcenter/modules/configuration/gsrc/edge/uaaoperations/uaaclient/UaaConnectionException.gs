package edge.uaaoperations.uaaclient

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode
uses java.lang.Throwable

class UaaConnectionException extends ApplicationException {

  private var _showExceptionData:boolean as ShowExceptionData = true

  construct(_code : ApplicationErrorCode){
    super(_code)
  }

  construct(_code : ApplicationErrorCode, myCause: Throwable){
    super(_code, myCause)
  }

  override property get Data(): Object {
    return ShowExceptionData ? super.Data: null
  }

}
