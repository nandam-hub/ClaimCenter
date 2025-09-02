package edge.capabilities.claim.fnol.policy.dto

uses edge.capabilities.claim.lob.fnol.policy.dto.PolicySummaryLobDTO
uses edge.jsonmapper.JsonProperty

class PolicySummaryRiskUnitsDTO {

  @JsonProperty
  private var _lobs : PolicySummaryLobDTO as Lobs

}
