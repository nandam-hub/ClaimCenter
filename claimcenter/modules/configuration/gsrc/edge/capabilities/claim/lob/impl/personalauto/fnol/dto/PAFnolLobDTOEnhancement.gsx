package edge.capabilities.claim.lob.impl.personalauto.fnol.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.impl.personalauto.PaTypeCode

enhancement PAFnolLobDTOEnhancement : edge.capabilities.claim.lob.fnol.dto.FnolLobDTO {

  @JsonProperty
  property get PersonalAuto() : PAFnolExtensionDTO {
    return this.lobExtensions.get(PaTypeCode.PersonalAuto) as PAFnolExtensionDTO
  }

  @JsonProperty
  property set PersonalAuto(data : PAFnolExtensionDTO) {
    this.lobExtensions.put(PaTypeCode.PersonalAuto, data)
  }

}
