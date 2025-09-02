package edge.capabilities.claim.document.dto

uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

class ClaimDocumentDTO extends DocumentBaseDTO {
  @JsonProperty @Required
  var _claimNumber : String as ClaimNumber
  
  @JsonProperty
  var _canDelete : Boolean as CanDelete

  /**
   * This one is working. Unlike inherited PublicID.
   */
  @JsonProperty
  var _workingPublicID : String as WorkingPublicID

}
