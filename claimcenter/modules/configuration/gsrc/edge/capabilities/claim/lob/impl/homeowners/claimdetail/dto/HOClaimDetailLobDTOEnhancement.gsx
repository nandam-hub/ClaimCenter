package edge.capabilities.claim.lob.impl.homeowners.claimdetail.dto

uses edge.jsonmapper.JsonProperty

enhancement HOClaimDetailLobDTOEnhancement : edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO {


  @JsonProperty
  property get Homeowner() : HOClaimDetailExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyType.TC_HOPHOMEOWNERS) as HOClaimDetailExtensionDTO
  }

  @JsonProperty
  property set Homeowner(data : HOClaimDetailExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_HOPHOMEOWNERS, data)
  }

}
