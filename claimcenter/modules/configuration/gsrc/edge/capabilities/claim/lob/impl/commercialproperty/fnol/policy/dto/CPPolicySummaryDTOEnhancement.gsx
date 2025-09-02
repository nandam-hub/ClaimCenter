package edge.capabilities.claim.lob.impl.commercialproperty.fnol.policy.dto

uses edge.capabilities.claim.lob.fnol.policy.dto.PolicySummaryLobDTO
uses edge.jsonmapper.JsonProperty


enhancement CPPolicySummaryDTOEnhancement: PolicySummaryLobDTO {

  @JsonProperty
  property get CommercialProperty(): CPPolicySummaryExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_COMMERCIALPROPERTY) as CPPolicySummaryExtensionDTO
  }

  @JsonProperty
  property set CommercialProperty(data: CPPolicySummaryExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_COMMERCIALPROPERTY, data)
  }
}
