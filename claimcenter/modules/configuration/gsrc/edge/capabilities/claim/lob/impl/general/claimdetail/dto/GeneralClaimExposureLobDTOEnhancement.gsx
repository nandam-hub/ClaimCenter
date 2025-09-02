package edge.capabilities.claim.lob.impl.general.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO
uses edge.jsonmapper.JsonProperty

enhancement GeneralClaimExposureLobDTOEnhancement: ClaimExposureLobDTO {

  @JsonProperty
  property get BusinessOwner() : GeneralClaimExposureExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSOWNERS) as GeneralClaimExposureExtensionDTO
  }

  @JsonProperty
  property get InlandMarine() : GeneralClaimExposureExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_INLANDMARINE) as GeneralClaimExposureExtensionDTO
  }

  @JsonProperty
  property get GeneralLiability() : GeneralClaimExposureExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_GENERALLIABILITY) as GeneralClaimExposureExtensionDTO
  }

  @JsonProperty
  property set BusinessOwner(data : GeneralClaimExposureExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSOWNERS, data)
  }

  @JsonProperty
  property set InlandMarine(data : GeneralClaimExposureExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_INLANDMARINE, data)
  }

  @JsonProperty
  property set GeneralLiability(data : GeneralClaimExposureExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_GENERALLIABILITY, data)
  }
}
