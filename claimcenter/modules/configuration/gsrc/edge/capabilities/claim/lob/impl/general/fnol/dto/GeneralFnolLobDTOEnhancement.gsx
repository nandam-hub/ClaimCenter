package edge.capabilities.claim.lob.impl.general.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses edge.jsonmapper.JsonProperty

enhancement GeneralFnolLobDTOEnhancement: FnolLobDTO {

  @JsonProperty
  property get BusinessOwners() : GeneralFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSOWNERS) as GeneralFnolExtensionDTO
  }

  @JsonProperty
  property get InlandMarine() : GeneralFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_INLANDMARINE) as GeneralFnolExtensionDTO
  }

  @JsonProperty
  property get GeneralLiability() : GeneralFnolExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_GENERALLIABILITY) as GeneralFnolExtensionDTO
  }

  @JsonProperty
  property set BusinessOwners(data : GeneralFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSOWNERS, data)
  }

  @JsonProperty
  property set InlandMarine(data : GeneralFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_INLANDMARINE, data)
  }

  @JsonProperty
  property set GeneralLiability(data : GeneralFnolExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_GENERALLIABILITY, data)
  }
}
