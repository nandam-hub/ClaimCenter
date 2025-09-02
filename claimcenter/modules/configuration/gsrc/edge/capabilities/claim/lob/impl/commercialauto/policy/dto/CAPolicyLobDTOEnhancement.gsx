package edge.capabilities.claim.lob.impl.commercialauto.policy.dto

uses edge.jsonmapper.JsonProperty

enhancement CAPolicyLobDTOEnhancement: edge.capabilities.claim.lob.policy.dto.PolicyLobDTO {

  @JsonProperty
  property get CommercialAuto() : CAPolicyExtensionDTO {
    return this.lobExtensions.get(PolicyType.TC_BUSINESSAUTO) as CAPolicyExtensionDTO
  }

  @JsonProperty
  property set CommercialAuto(data : CAPolicyExtensionDTO) {
    this.lobExtensions.put(PolicyType.TC_BUSINESSAUTO, data)
  }

}
