package gw.api.claim

uses gw.api.address.CCAddressOwner
uses gw.api.address.ClaimAddressOwner

@Export
class FnolWizardGeneralLiabilityHelper {
  public final static var PRIMARY_LOCATION: String = "primary"
  public final static var OTHER_LOCATION: String = "other"

  private final var _claim: Claim
  private var _locationChoice : String
  private final var _incidentListUIHelper : IncidentListUIHelper
  protected var _damages : DamageManager[] as readonly Damages

  construct(claim: Claim) {
    _claim = claim
    _damages = getDamages(claim)
    _locationChoice = null

    _incidentListUIHelper = new IncidentListUIHelper(claim, {
        IncidentUIHelpers.INJURY,
        IncidentUIHelpers.PROPERTY_LIABILITY
    })
  }

  property set LocationChoice(v : String) {
    if (v == PRIMARY_LOCATION) {
      _claim.LossLocation = _claim.Policy.PrimaryLocation.Address
    } else if (IsOtherLocationChosen) {
      _claim.LossLocation = null
    }

    _locationChoice = v
  }

  property get LocationChoice() : String {
    return _locationChoice
  }

  property get IsOtherLocationChosen() : boolean {
    return _locationChoice == OTHER_LOCATION
  }

  property get IncidentListUIHelper(): IncidentListUIHelper {
    return _incidentListUIHelper
  }

  function getAddressesWithoutPrimaryLocation() : CCAddressOwner {
    return new GeneralLiabilityClaimAddressOwner(_claim)
  }

  function setDamageAccordingToLossCause() {
    switch(_claim.LossCause) {
      case LossCause.TC_FIRE:
        setDamagePresent("PropertyFireDamage")
        break
      default:
        clearDamages()
    }
  }

  private function clearDamages() {
    Damages.each(\p -> {p.Exists = false})
  }

  private function setDamagePresent(propertyName : String) {
    Damages.firstWhere(\ d -> d.ClaimProperty.Name == propertyName).Exists = true
  }

  static function getDamages(claim : Claim) : DamageManager[] {
    return { new DamageManager(claim, "fire", "PropertyFireDamage") }
  }

  private static class GeneralLiabilityClaimAddressOwner extends ClaimAddressOwner {
    construct(c : Claim) {
      super(c)
    }

    override property get Addresses() : Address[] {
      // Remove the primary address of the policy from the usual list
      var addressList = super.Addresses.toList()
      addressList.remove(Claim.Policy.PrimaryLocation.Address)
      return addressList.toTypedArray()
    }
  }
}
