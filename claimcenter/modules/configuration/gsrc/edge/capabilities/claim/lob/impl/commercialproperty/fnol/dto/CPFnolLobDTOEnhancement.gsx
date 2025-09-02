package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.jsonmapper.JsonProperty


enhancement CPFnolLobDTOEnhancement: FnolLobDTO {

  @JsonProperty
  property get CommercialProperty() : CPFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_COMMERCIALPROPERTY) as CPFnolExtensionDTO
  }

  @JsonProperty
  property set CommercialProperty(data : CPFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_COMMERCIALPROPERTY, data)
  }

}
