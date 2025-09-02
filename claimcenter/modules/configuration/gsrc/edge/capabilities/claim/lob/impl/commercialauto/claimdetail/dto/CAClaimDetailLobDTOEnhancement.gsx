package edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.jsonmapper.JsonProperty

enhancement CAClaimDetailLobDTOEnhancement: ClaimDetailLobDTO {

  @JsonProperty
  property get CommercialAuto() : CAClaimDetailExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSAUTO) as CAClaimDetailExtensionDTO
  }

  @JsonProperty
  property set CommercialAuto(data : CAClaimDetailExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSAUTO, data)
  }
}
