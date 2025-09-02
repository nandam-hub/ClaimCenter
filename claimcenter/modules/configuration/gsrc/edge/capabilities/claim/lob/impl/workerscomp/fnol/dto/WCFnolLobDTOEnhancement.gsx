package edge.capabilities.claim.lob.impl.workerscomp.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.jsonmapper.JsonProperty

enhancement WCFnolLobDTOEnhancement: FnolLobDTO {

  @JsonProperty
  property get WorkersComp() : WCFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_WORKERSCOMP) as WCFnolExtensionDTO
  }

  @JsonProperty
  property set WorkersComp(data : WCFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_WORKERSCOMP, data)
  }
}
