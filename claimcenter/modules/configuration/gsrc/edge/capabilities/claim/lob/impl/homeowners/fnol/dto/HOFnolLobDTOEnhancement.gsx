package edge.capabilities.claim.lob.impl.homeowners.fnol.dto

uses edge.jsonmapper.JsonProperty

enhancement HOFnolLobDTOEnhancement: edge.capabilities.claim.lob.fnol.dto.FnolLobDTO {

  @JsonProperty
  property get Homeowners() : HOFnolLobExtensionDTO {
    return this.lobExtensions.get(typekey.PolicyType.TC_HOPHOMEOWNERS) as HOFnolLobExtensionDTO
  }

  @JsonProperty
  property set Homeowners(data : HOFnolLobExtensionDTO) {
    this.lobExtensions.put(typekey.PolicyType.TC_HOPHOMEOWNERS, data)
  }

}
