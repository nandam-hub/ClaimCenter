package edge.capabilities.claim.address
uses edge.capabilities.address.dto.AddressDTO

/**
 * Plugin used for dealing with claim addresses.
 */
interface IClaimAddressPlugin {
  /**
   * Converts claim address into the DTO.
   */
  public function toDTO(claim : Claim, address : Address) : AddressDTO
  
  
  /**
   * Returns updated address corresponding to the specific address DTO.
   */
  public function getUpdatedAddress(claim : Claim, address : AddressDTO) : Address
}
