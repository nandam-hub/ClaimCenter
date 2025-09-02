package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer


class PropertyRiskUnitDTO {

  @JsonProperty
  var _locationNumber : String as LocationNumber

  @JsonProperty
  var _policySystemId : String as PolicySystemId

  @JsonProperty
  var _buildingNumber : String as BuildingNumber

  @JsonProperty
  var _address : String as Address

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _addressLine1 : String as AddressLine1

  @JsonProperty
  var _addressLine1Kanji : String as AddressLine1Kanji

  @JsonProperty
  var _addressLine2 : String as AddressLine2

  @JsonProperty
  var _addressLine2Kanji : String as AddressLine2Kanji

  @JsonProperty
  var _city : String as City

  @JsonProperty
  var _cityKanji : String as CityKanji
}
