package edge.capabilities.claim.document.dto

uses edge.capabilities.document.dto.DocumentUploadDTO
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

class ClaimDocumentUploadDTO extends DocumentUploadDTO {

  @JsonProperty @Required
  var _claimNumber : String as ClaimNumber

}
