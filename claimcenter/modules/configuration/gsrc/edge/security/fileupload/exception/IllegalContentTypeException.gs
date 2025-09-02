package edge.security.fileupload.exception

uses edge.exception.ApplicationException
uses edge.exception.ApplicationErrorCode

class IllegalContentTypeException extends ApplicationException {

  construct() {
    super(ApplicationErrorCode.GW_ILLEGAL_CONTENTTYPE_ERROR)
  }

  construct(aMessage : String) {
    super(ApplicationErrorCode.GW_ILLEGAL_CONTENTTYPE_ERROR)
    Message = aMessage;
  }

}
