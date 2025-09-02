package edge.capabilities.claim.lob.impl.homeowners.fnol.dto

uses edge.jsonmapper.JsonProperty

class PropertyWaterDamageDTO {
  @JsonProperty
  private var _publicID : String as PublicID

  @JsonProperty
  private var _waterSource : typekey.WaterSource as WaterSource
  
  @JsonProperty
  private var _hasWaterBeenTurnedOff : Boolean as HasWaterBeenTurnedOff
  
  @JsonProperty
  private var _isRoofProtected : Boolean as IsRoofProtected

}
