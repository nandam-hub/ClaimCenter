package edge.capabilities.claim.lob.impl.homeowners.fnol.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Size

class PropertyFireDamageDTO {
  @JsonProperty
  private var _publicID : String as PublicID

  @JsonProperty  
  @Size(0, 250)
  private var _fireSource : String as FireSource
  
  @JsonProperty
  @Size(0, 250)
  private var _howWasFireDiscovered : String as HowWasFireDiscovered
  
  @JsonProperty
  private var _isHomeHabitable : Boolean as IsHomeHabitable
  
  @JsonProperty
  private var _isHomeSecure : Boolean as IsHomeSecure

}
