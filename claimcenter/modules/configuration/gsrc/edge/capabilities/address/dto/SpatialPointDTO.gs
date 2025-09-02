package edge.capabilities.address.dto

uses edge.jsonmapper.JsonProperty

uses java.math.BigDecimal

class SpatialPointDTO {

  @JsonProperty
  var _latitude : BigDecimal as Latitude

  @JsonProperty
  var _longitude : BigDecimal as Longitude
}
