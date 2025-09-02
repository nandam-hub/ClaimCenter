package edge.capabilities.claim.lob.impl.homeowners.policy.dto

uses edge.jsonmapper.JsonProperty

enhancement HOPolicyLobDTOEnhancement : edge.capabilities.claim.lob.policy.dto.PolicyLobDTO {

  @JsonProperty
  property get Homeowner() : HOPolicyExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyType.TC_HOPHOMEOWNERS) as HOPolicyExtensionDTO
  }

  @JsonProperty
  property set Homeowner(data : HOPolicyExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_HOPHOMEOWNERS, data)
  }

}
