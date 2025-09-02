package edge.capabilities.claim.lob.impl.personalauto.policy.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode

enhancement PAPolicyLobDTOEnhancement : edge.capabilities.claim.lob.policy.dto.PolicyLobDTO {

  @JsonProperty
  property get PersonalAuto() : PAPolicyExtensionDTO {
    return this.lobExtensions.get(PaTypeCode.PersonalAuto) as PAPolicyExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PAPolicyExtensionDTO) {
    this.lobExtensions.put(PaTypeCode.PersonalAuto, data)
  }

}
