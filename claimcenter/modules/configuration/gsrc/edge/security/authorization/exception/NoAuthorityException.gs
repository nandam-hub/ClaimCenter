package edge.security.authorization.exception
uses java.lang.Exception

class NoAuthorityException extends Exception   {

  construct() {}

  construct(msg:String) {
    super(msg)
  }

}
