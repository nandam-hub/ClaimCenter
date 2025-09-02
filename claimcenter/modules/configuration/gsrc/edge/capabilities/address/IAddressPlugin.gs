package edge.capabilities.address

uses edge.capabilities.address.dto.AddressDTO
uses gw.api.address.AddressOwner

/**
 * Plugin used for address work.
 */
interface IAddressPlugin {
  /**
   * Converts address to DTO object.
   */
  function toDto(address : Address) : AddressDTO

  /**
   * Updates address from the dto.
   */
  function updateFromDTO(address : Address, dto : AddressDTO)

  /**
   * Checks if two addresses are different.
   */
  function doAddressesDiffer(addr1 : AddressDTO, addr2 : AddressDTO) : Boolean
}
