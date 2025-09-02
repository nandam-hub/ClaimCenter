package edge.capabilities.claim.lob.impl.workerscomp.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.jsonmapper.JsonProperty

enhancement WCClaimDetailLobDTOEnhancement: ClaimDetailLobDTO {

  @JsonProperty
  property get WorkersComp() : WCClaimDetailExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_WORKERSCOMP) as WCClaimDetailExtensionDTO
  }

  @JsonProperty
  property set WorkersComp(data : WCClaimDetailExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_WORKERSCOMP, data)
  }
}
