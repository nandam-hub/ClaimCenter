package edge.capabilities.address.dto

uses edge.jsonmapper.JsonProperty

/**
 * Result of an address lookup.
 */
class AddressLookupResultDTO {

  /**
   * A value indicating how accurate the found address matches the partial address provided to the lookup
   */
  @JsonProperty
  var _matchAccuracy : float as MatchAccuracy

  /**
   * A possible matching address
   */
  @JsonProperty
  var _address : AddressDTO as Address

  construct(){}
}
