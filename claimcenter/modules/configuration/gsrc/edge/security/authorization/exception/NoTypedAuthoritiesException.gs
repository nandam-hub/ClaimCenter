package edge.security.authorization.exception

uses java.lang.Exception

class NoTypedAuthoritiesException extends Exception   {

  construct() {}

  construct(msg:String) {
    super(msg)
  }

}
