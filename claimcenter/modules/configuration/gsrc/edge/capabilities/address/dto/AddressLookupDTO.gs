package edge.capabilities.address.dto

uses edge.jsonmapper.JsonProperty

/**
 * A partial address used for address lookups
 */
class AddressLookupDTO {

  /**
   * First line of the address
   */
  @JsonProperty
  var _addressLine1 : String as AddressLine1

  /**
   * Second line of the address
   */
  @JsonProperty
  var _addressLine2 : String as AddressLine2

  /**
   * Third line of the address
   */
  @JsonProperty
  var _addressLine3 : String as AddressLine3

  /**
   * City
   */
  @JsonProperty
  var _city : String as City

  /**
   * State
   */
  @JsonProperty
  var _state : typekey.State as State

  /**
   * Postal Code
   */
  @JsonProperty
  var _postalCode : String as PostalCode

  /**
   * Country
   */
  @JsonProperty
  var _country : typekey.Country as Country

  construct(){}
}
