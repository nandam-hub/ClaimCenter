package gw.api.address

uses gw.config.LOBAbstraction

/**
 * CCAddressOwner object for the Work Compensation Claim entity.
 * See AddressOwner and CCAddressOwner for details of what an
 * AddressOwner object does.
 * The difference is that the default location is <none>
 */
@Export
class WorkCompClaimAddressOwner extends ClaimAddressOwner {
  private var _hiddenFields: Set<AddressOwnerFieldId>
  private var _claim: Claim
  final static var LOCATION_FIELDS = AddressOwnerFieldId.ALL_PCF_FIELDS
      .union({CCAddressOwnerFieldId.ADDRESSTYPE, CCAddressOwnerFieldId.DESCRIPTION,
          CCAddressOwnerFieldId.VALIDUNTIL, CCAddressOwnerFieldId.LOCATIONCODE,
          CCAddressOwnerFieldId.JURISDICTIONSTATE})


  construct(inClaim: Claim) {
    super(inClaim)
    _claim = inClaim
    _hiddenFields = LOCATION_FIELDS
  }

  /**
   * Should we preselect the "new" address, if possible?  We typically do this
   * whenever we're creating a new claim (i.e. if state is draft). This is true
   * even for homeowner's, where we handle the common case of the primary
   * dwelling being the loss address via a special custom control.
   */
  override property get PreselectNewAddress(): boolean {
    return Claim.State == TC_DRAFT and !LOBAbstraction.ForClaim.ForLossType.isWorkComp(Claim)
  }

  override property set Address(newAddress : Address) {
    super.Address = newAddress
    if (!NonEditableAddresses.contains(newAddress)) {
      hideOnlyClaimFileHiddenFields()
    } else {
      hideLocationFields()
    }
  }

  override property get HiddenFields(): Set<AddressOwnerFieldId> {
    return _hiddenFields
  }

  private function hideOnlyClaimFileHiddenFields() {
    _hiddenFields = AddressFields.getClaimFileHiddenFields(_claim)
  }

  private function hideLocationFields() {
    _hiddenFields = LOCATION_FIELDS
  }
}
