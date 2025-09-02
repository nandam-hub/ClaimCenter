package edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto

uses edge.jsonmapper.JsonProperty

enhancement PAClaimExposureLobDTOEnhancement: edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO {


  @JsonProperty
  property get PersonalAuto() : PAClaimExposureExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyType.TC_PERSONALAUTO) as PAClaimExposureExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PAClaimExposureExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_PERSONALAUTO, data)
  }

}
