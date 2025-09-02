package edge.capabilities.address
uses edge.capabilities.address.dto.AddressDTO

interface IAddressCompletionPlugin {
  /**
   * Gets address from zip code
   */
   @Param("zipCode", "zip code")
   @Returns("Address with the fields set from the zip code (state, city, etc...). If it is unable to determine information, these fields will be null (like street address, etc...).")

  public function getAddressFromZipCode(zipCode: String) : AddressDTO

}
