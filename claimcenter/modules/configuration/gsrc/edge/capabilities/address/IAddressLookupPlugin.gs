package edge.capabilities.address

uses edge.capabilities.address.dto.AddressLookupResultsDTO
uses edge.capabilities.address.dto.AddressLookupDTO
uses edge.capabilities.address.dto.AddressLookupResultDTO

interface IAddressLookupPlugin {

  /**
   * Gets possible addresses given a partial address as a string
   */
   @Param("partialAddress", "A partial address.")
   @Returns("A lookup results object")
   public function lookupAddressUsingString(partialAddress: String) : AddressLookupResultsDTO

  /**
   * Gets possible addresses based on the search input from the user and the postal code
   */
   @Param("partialAddress", "A partial address.")
   @Param("postalCode", "A postalCode.")
   @Returns("A lookup results object")
   public function lookupAddressUsingStringAndFilterByPostalCode(partialAddress: String, postalCode: String) : AddressLookupResultsDTO

  /**
   * Gets possible addresses given a partial address as an Address object
   */
  @Param("partialAddress", "A partial address.")
  @Returns("A lookup results object")
  public function lookupAddressUsingObject(partialAddress: AddressLookupDTO) : AddressLookupResultsDTO

  /**
   * Gets city and state info from a given ZIP code.
   */
  @Param("postalCode", "A postalCode.")
  @Returns("A lookup result object")
  public function lookupAddressUsingPostalCode(postalCode: String) : AddressLookupResultsDTO
}
