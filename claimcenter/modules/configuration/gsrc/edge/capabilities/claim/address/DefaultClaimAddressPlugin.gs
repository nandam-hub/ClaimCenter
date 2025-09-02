package edge.capabilities.claim.address
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.address.dto.AddressDTO
uses edge.util.mapping.RefUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin
uses java.util.HashSet
uses java.util.Collections

/**
 * Default implementation of claim address plugin.
 */
class DefaultClaimAddressPlugin implements IClaimAddressPlugin {

  /**
   * Peer (delegating) address plugin.
   */
  private var _peer : IAddressPlugin

  private var _addressUpdater : RefUpdater<Claim,Address,AddressDTO> as readonly AddressUpdater

  @ForAllGwNodes
  @Param("peer", "Basic (non-claim) address manipulation plugin")
  construct(peer : IAddressPlugin,authzProvider:IAuthorizerProviderPlugin) {
    this._peer = peer
    this._addressUpdater = new RefUpdater<Claim,Address,AddressDTO>(authzProvider) {
      : ToCreate = \ claim,d -> new Address(),
      : AllowedValues = \ claim -> getClaimAddresses(claim)
    }

  }

  override function toDTO(claim : Claim, address : Address) : AddressDTO {
    return _peer.toDto(address)
  }

  override function getUpdatedAddress(claim : Claim, address : AddressDTO) : Address {
    return AddressUpdater.updateRef(claim, address,\ addr,dto -> _peer.updateFromDTO(addr,dto))
  }

  /**
   * Returns all claim addresses available to the user.
   */
  protected function getClaimAddresses(claim : Claim) : Address[] {
    var contactRoles = {ContactRole.TC_COVEREDPARTY,ContactRole.TC_INSURED}
    final var allAddresses = new HashSet<Address>()
    allAddresses.add(claim.maincontact.PrimaryAddress)

    for(con in claim.Contacts){
      var allowedRoles = claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP
          ? contactRoles.concat({ContactRole.TC_INJURED}).toList()
          : contactRoles

      if(contactHasRole(con, allowedRoles)){
        allAddresses.add(con.Contact.PrimaryAddress)
      }
    }

    var policyAddresses = claim.Policy.getPolicyLocations().map(\location -> location.Address)
    allAddresses.addAll(policyAddresses.toList())

    if (claim.Policy.PolicyType == PolicyType.TC_HOPHOMEOWNERS) {
      allAddresses.add(claim.Policy.PrimaryLocation.Address)
    } else {
      allAddresses.addAll(claim.Addresses.toList())
    }
    return allAddresses.toTypedArray()
  }

  private function contactHasRole(contact : ClaimContact, acceptableRoles: List<ContactRole>) : Boolean {
    return contact.Roles.hasMatch( \ role -> acceptableRoles.contains(role.Role))
  }

}
