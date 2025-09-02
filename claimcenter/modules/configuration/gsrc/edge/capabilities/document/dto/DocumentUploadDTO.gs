package edge.capabilities.document.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size

/**
 * Document upload request.
 */
class DocumentUploadDTO {  

  @JsonProperty   @Required @Size(0,40)
  var _sessionID : String as SessionID

  @JsonProperty @Required @Size(0, 80)
  var _name : String as Name

  @JsonProperty @Size(0, 255)
  var _description : String as Description

  @JsonProperty @Required @Size(0, 80)
  var _mimeType : String as MimeType
}
