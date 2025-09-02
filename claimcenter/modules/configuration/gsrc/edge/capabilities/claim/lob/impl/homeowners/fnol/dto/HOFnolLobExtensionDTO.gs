package edge.capabilities.claim.lob.impl.homeowners.fnol.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO

/**
 * Homeowners fnol extension object.
 */
class HOFnolLobExtensionDTO implements IFnolLobExtensionDTO{
  @JsonProperty  
  private var _propertyFireDamage : PropertyFireDamageDTO as PropertyFireDamage
  
  @JsonProperty
  private var _propertyWaterDamage : PropertyWaterDamageDTO as PropertyWaterDamage

}

