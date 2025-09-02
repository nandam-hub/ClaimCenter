package edge.capabilities.claim.lob.impl.general.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.jsonmapper.JsonProperty

enhancement GeneralClaimDetailLobDTOEnhancement: ClaimDetailLobDTO {

  @JsonProperty
  property get BusinessOwner() : GeneralClaimDetailExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSOWNERS) as GeneralClaimDetailExtensionDTO
  }

  @JsonProperty
  property get InlandMarine() : GeneralClaimDetailExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_INLANDMARINE) as GeneralClaimDetailExtensionDTO
  }

  @JsonProperty
  property get GeneralLiability() : GeneralClaimDetailExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_GENERALLIABILITY) as GeneralClaimDetailExtensionDTO
  }

  @JsonProperty
  property set BusinessOwner(data : GeneralClaimDetailExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSOWNERS, data)
  }

  @JsonProperty
  property set InlandMarine(data : GeneralClaimDetailExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_INLANDMARINE, data)
  }

  @JsonProperty
  property set GeneralLiability(data : GeneralClaimDetailExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_GENERALLIABILITY, data)
  }
}
