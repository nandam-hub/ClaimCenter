package edge.capabilities.claim.summary.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

class ClaimSummaryResultDTO {
  @JsonProperty
  var _maxNumberOfResults : Integer as MaxNumberOfResults

  @JsonProperty
  var _claims : ClaimSummaryDTO[] as Items
}
