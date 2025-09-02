package edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode

enhancement PAClaimDetailLobDTOEnhancement: edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO {


  @JsonProperty
  property get PersonalAuto() : PAClaimDetailExtensionDTO {
    return this.lobExtensions.get(PaTypeCode.PersonalAuto) as PAClaimDetailExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PAClaimDetailExtensionDTO) {
    this.lobExtensions.put(PaTypeCode.PersonalAuto, data)
  }

}
