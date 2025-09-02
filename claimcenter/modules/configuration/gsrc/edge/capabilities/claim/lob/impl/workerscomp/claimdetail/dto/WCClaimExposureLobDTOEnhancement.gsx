package edge.capabilities.claim.lob.impl.workerscomp.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO
uses edge.jsonmapper.JsonProperty

enhancement WCClaimExposureLobDTOEnhancement: ClaimExposureLobDTO {

  @JsonProperty
  property get WorkersComp() : WCClaimExposureExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_WORKERSCOMP) as WCClaimExposureExtensionDTO
  }

  @JsonProperty
  property set WorkersComp(data : WCClaimExposureExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_WORKERSCOMP, data)
  }
}
