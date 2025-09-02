package edge.capabilities.claim.lob.impl.commercialauto.fnol.policy.dto

uses edge.capabilities.claim.lob.fnol.policy.dto.PolicySummaryLobDTO
uses edge.jsonmapper.JsonProperty


enhancement CAPolicySummaryDTOEnhancement: PolicySummaryLobDTO {

  @JsonProperty
  property get CommercialAuto(): CAPolicySummaryExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSAUTO) as CAPolicySummaryExtensionDTO
  }

  @JsonProperty
  property set CommercialAuto(data: CAPolicySummaryExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSAUTO, data)
  }
}
