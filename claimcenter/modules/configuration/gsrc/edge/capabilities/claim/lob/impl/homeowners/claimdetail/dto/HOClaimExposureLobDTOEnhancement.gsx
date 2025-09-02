package edge.capabilities.claim.lob.impl.homeowners.claimdetail.dto

uses edge.jsonmapper.JsonProperty

enhancement HOClaimExposureLobDTOEnhancement : edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO {


  @JsonProperty
  property get Homeowner() : HOClaimExposureExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyType.TC_HOPHOMEOWNERS) as HOClaimExposureExtensionDTO
  }

  @JsonProperty
  property set Homeowner(data : HOClaimExposureExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_HOPHOMEOWNERS, data)
  }

}
