package edge.capabilities.address.dto

uses edge.jsonmapper.JsonProperty

/**
 * Result of an address lookup.
 */
class AddressLookupResultsDTO {

  /**
   * Any error code that was returned by the address lookup provider
   */
  @JsonProperty
  var _errorCode : String as ErrorCode

  /**
   * A description of any error that was returned by the address lookup provider
   */
  @JsonProperty
  var _errorDescription : String as ErrorDescription

  /**
   * A collection of address lookup results
   */
  @JsonProperty
  var _matches : AddressLookupResultDTO[] as Matches

  construct(){}
}
