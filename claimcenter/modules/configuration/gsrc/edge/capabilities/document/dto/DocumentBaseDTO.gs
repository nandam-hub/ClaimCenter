package edge.capabilities.document.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses java.util.Date

/** Base information about document. */
class DocumentBaseDTO {
  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty @Required @Size(0,40)
  var _sessionID : String as SessionID

  @JsonProperty @Required @Size(0, 255)
  var _docUID : String as DocUID

  @JsonProperty @Required
  var _name : String as Name

  @JsonProperty @Size(0, 255)
  var _description : String as Description

  @JsonProperty @Required
  var _documentType : typekey.DocumentType as DocumentType

  @JsonProperty @Size(0, 80)
  var _mimeType : String as MimeType

  @JsonProperty @Size(0, 60)
  var _recipient : String as Recipient

  @JsonProperty
  var _securityType : typekey.DocumentSecurityType as SecurityType

  @JsonProperty @Required
  var _status : DocumentStatusType as Status

  @JsonProperty @Size(0, 60)
  var _author : String as Author

  @JsonProperty
  var _dateModified : Date as DateModified

}
