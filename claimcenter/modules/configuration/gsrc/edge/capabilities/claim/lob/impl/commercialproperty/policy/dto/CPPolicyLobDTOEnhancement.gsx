package edge.capabilities.claim.lob.impl.commercialproperty.policy.dto

uses edge.capabilities.claim.lob.policy.dto.PolicyLobDTO
uses edge.jsonmapper.JsonProperty

enhancement CPPolicyLobDTOEnhancement: PolicyLobDTO {

  @JsonProperty
  property get CommercialProperty() : CPPolicyExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_COMMERCIALPROPERTY) as CPPolicyExtensionDTO
  }

  @JsonProperty
  property set CommercialProperty(data : CPPolicyExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_COMMERCIALPROPERTY, data)
  }
}
