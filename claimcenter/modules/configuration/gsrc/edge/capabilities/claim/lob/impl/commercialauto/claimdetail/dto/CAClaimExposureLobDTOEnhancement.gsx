package edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO
uses edge.jsonmapper.JsonProperty

enhancement CAClaimExposureLobDTOEnhancement : ClaimExposureLobDTO {
  @JsonProperty
      property get CommercialAuto() : CAClaimExposureExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSAUTO) as CAClaimExposureExtensionDTO
  }

  @JsonProperty
      property set CommercialAuto(data : CAClaimExposureExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_BUSINESSAUTO, data)
  }
}
