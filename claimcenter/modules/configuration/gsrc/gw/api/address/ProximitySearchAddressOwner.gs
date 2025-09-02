package gw.api.address

uses java.util.Set
uses gw.api.locale.DisplayKey

@Export
class ProximitySearchAddressOwner extends ContactSearchAddressOwner {
  private final static var hiddenForProximitySearchFields = hiddenForProximiySearch().freeze()

  private static function  hiddenForProximiySearch(): Set<AddressOwnerFieldId> {
    var hiddenFields = AddressOwnerFieldId.HIDDEN_FOR_PROXIMITY_SEARCH.copy()
    hiddenFields.addAll(AddressOwnerFieldId.ADDRESSLINE2_FIELDS)
    hiddenFields.add(AddressOwnerFieldId.ADDRESSLINE3)
    return hiddenFields
  }

  private var _contactSearchCriteria : ContactSearchCriteria
  private var _claim : Claim as Claim
  
  construct(contactSearchCriteria : ContactSearchCriteria, aClaim : Claim) {
    super(contactSearchCriteria)
    _contactSearchCriteria = contactSearchCriteria
    _claim = aClaim
  }

  override property get AddressLine1Label() : String {
    return DisplayKey.get("Web.AddressBook.AddressInputSet.ProximitySearch.Address1")
  }

  override property set Address(value : Address) {
      _contactSearchCriteria.ProximitySearchCenter = value
  }
  
  override property get Address() : Address {
    return _contactSearchCriteria.ProximitySearchCenter
  }

  override property get HiddenFields() : Set<AddressOwnerFieldId> {
    return hiddenForProximitySearchFields
  }
  
  override function isAvailable(fieldId : AddressOwnerFieldId) : boolean {
    return _contactSearchCriteria.ProximitySearchParameters != null
  }
  
}
