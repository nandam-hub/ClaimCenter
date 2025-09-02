package edge.capabilities.claim.lob.impl.commercialauto.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.jsonmapper.JsonProperty

enhancement CAFnolLobDTOEnhancement: FnolLobDTO {

  @JsonProperty
  property get CommercialAuto() : edge.capabilities.claim.lob.impl.commercialauto.fnol.dto.CAFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSAUTO) as edge.capabilities.claim.lob.impl.commercialauto.fnol.dto.CAFnolExtensionDTO
  }

  @JsonProperty
  property set CommercialAuto(data : edge.capabilities.claim.lob.impl.commercialauto.fnol.dto.CAFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSAUTO, data)
  }

}
