package gw.entity
uses gw.api.address.ClaimAddressOwner
uses gw.api.address.CCAddressOwner
uses gw.api.address.WorkCompClaimAddressOwner

/**
 * Address owner utilities, allowing the claim's loss location to be modified
 * by the generic AddressInputSet PCF file.
 */
@Export
enhancement GWClaimAddressOwnerEnhancement : Claim {

  /** The address owner object required by the AddressInputSet */
  property get AddressOwner() : CCAddressOwner {
    return new ClaimAddressOwner(this)
  }

  /** The address owner object required by the AddressInputSet for WC claims */
  property get WCAddressOwner() : CCAddressOwner {
    return new WorkCompClaimAddressOwner(this)
  }

}
