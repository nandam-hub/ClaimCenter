package gw.api.claim

uses gw.api.address.ClaimAddressOwner
uses gw.api.address.CCAddressOwner
uses gw.config.LOBAbstraction
uses gw.api.address.AddressJurisdictionHandler

@Export
abstract class HomeownersHelper {

  /**
   * Checkbox icon representing dwelling incidents
   */
  public static final var CHECKBOX_DWELLING_ICON : String = "dwelling"

  /**
   * Checkbox icon representing other structures incidents
   */
  public static final var CHECKBOX_OTHER_STRUCTURES_ICON : String = "other_structures"

  /**
   * Checkbox icon representing living expenses incidents
   */
  public static final var CHECKBOX_LIVING_EXPENSES_ICON : String = "loss_of_use"

  /**
   * Checkbox icon representing other proeprty contents incidents
   */
  public static final var CHECKBOX_PROPERTY_CONTENTS_ICON : String = "contents"

  protected var _claim : Claim
  protected var _damages : DamageManager[] as readonly Damages
  protected var _locationChoice : String
  protected var _dwellingIncident : DwellingIncident as readonly DwellingIncident
  protected var _otherStructureIncident : OtherStructureIncident as readonly OtherStructureIncident
  protected var _propertyContentsIncident : PropertyContentsIncident as readonly PropertyContentsIncident
  protected var _livingExpensesIncident : LivingExpensesIncident as readonly LivingExpensesIncident
  private var _incidentListUIHelper : IncidentListUIHelper as readonly IncidentListUIHelper
  

  private static class HomeownersClaimAddressOwner extends ClaimAddressOwner {

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
  
  construct(claim : Claim, listUIHelper : IncidentListUIHelper) {
    _claim = claim
    _damages = getDamages(claim)
    _dwellingIncident = claim.DwellingIncidentsOnly.length > 0 ? claim.DwellingIncidentsOnly[0] : null
    _otherStructureIncident = claim.OtherStructureIncidentsOnly.length > 0 ? claim.OtherStructureIncidentsOnly[0] : null
    _propertyContentsIncident = claim.PropertyContentsIncidentsOnly.length > 0 ? claim.PropertyContentsIncidentsOnly[0] : null
    _livingExpensesIncident = claim.LivingExpensesIncidentsOnly.length > 0 ? claim.LivingExpensesIncidentsOnly[0] : null
    _incidentListUIHelper = listUIHelper
  }

  static function getDamages(claim : Claim) : DamageManager[] {
    return {
      new DamageManager(claim, "fire", "PropertyFireDamage"),
      new DamageManager(claim, "water", "PropertyWaterDamage")
    }
  }

  property get DamageNames() : String[] {
    return Damages.map(\ d -> d.ClaimProperty.Name)
  }
  
  property get SelectedDamageNames() : String[] {
    return Damages.where(\ d -> d.Exists).map(\d -> d.ClaimProperty.Name)
  }
  
  property set SelectedDamageNames(selectedNames : String[]) {
    for (d in Damages) {
      d.Exists = selectedNames.contains(d.ClaimProperty.Name)
    }
  }
  
  function getDamageManagerByPropertyName(propertyName : String) : DamageManager {
    return Damages.firstWhere(\ d -> d.ClaimProperty.Name == propertyName)
  }
  
  function setDamageAccordingToLossCause() {
    switch(_claim.LossCause) {
    case LossCause.TC_FIRE:
      setDamagePresent("PropertyFireDamage")
      break
    case LossCause.TC_WATERDAMAGE:
      setDamagePresent("PropertyWaterDamage")
      break
    }      
  }

  function setDamagePresent(propertyName : String) {
    Damages.firstWhere(\ d -> d.ClaimProperty.Name == propertyName).Exists = true
  }
  
  function getAddressesWithoutPrimaryLocation() : CCAddressOwner {
    return new HomeownersClaimAddressOwner(_claim)
  }
  
  property set LocationChoice(v : String) {
    _locationChoice = v
    
    if (_locationChoice.equals("primary")) {
      _claim.LossLocation = _claim.Policy.PrimaryLocation.Address
      _claim.JurisdictionState = AddressJurisdictionHandler.getJurisdiction(_claim.LossLocation)
    } else if (_locationChoice.equals("other")) {
      _claim.LossLocation = null 
    }
  }  

  property get LocationChoice() : String {
    return _locationChoice
  }

  property get DwellingCoverageType() : CoverageType {
    return LOBAbstraction.ForPolicy.ForHomeowners.getDwellingCoverageType(_claim.Policy)
  }

  property get OtherStructuresCoverageType() : CoverageType {
    return LOBAbstraction.ForPolicy.ForHomeowners.getOtherStructuresCoverageType(_claim.Policy)
  }

  property get PersonalPropertyCoverageType() : CoverageType {
    return LOBAbstraction.ForPolicy.ForHomeowners.getPersonalPropertyCoverageType(_claim.Policy)
  }

  property get LossOfUseCoverageType() : CoverageType {
    return LOBAbstraction.ForPolicy.ForHomeowners.getLossOfUseCoverageType(_claim.Policy)
  }

  property get PersonalLiabilityCoverageType() : CoverageType {
    return LOBAbstraction.ForPolicy.ForHomeowners.getPersonalLiabilityCoverageType(_claim.Policy)
  }

}
