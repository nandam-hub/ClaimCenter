package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.capabilities.address.dto.AddressDTO
uses edge.jsonmapper.JsonProperty

public class LocationDTO {

  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty
  var _address : AddressDTO as Address

  @JsonProperty
  var _number : String as Number
}
