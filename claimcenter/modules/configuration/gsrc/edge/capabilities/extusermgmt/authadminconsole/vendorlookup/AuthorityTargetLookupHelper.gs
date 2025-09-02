package edge.capabilities.extusermgmt.authadminconsole.vendorlookup

uses gw.api.locale.DisplayKey
uses gw.plugin.contact.ContactSystemPlugin
uses gw.plugin.Plugins
uses edge.PlatformSupport.Bundle
uses gw.api.util.DisplayableException
uses gw.plugin.contact.search.ContactSearchFilter

class AuthorityTargetLookupHelper {

  private static final var DEFAULT_MAX_SEARCH_RESULTS = 500
  private var _addressBookAdapter : ContactSystemPlugin

  construct() {
    _addressBookAdapter = Plugins.get(ContactSystemPlugin)
  }

  /**
   * Lookup target display names for vendor contacts
   *
   * </br>
   * Throws -
   * <ul>
   * <li>IllegalDtoStateException If trying to return non vendor contacts and if insufficient search criteria is provided</li>
   * </ul>
   * @param contactSearchCriteria contact search criteria
   * @return authority target lookups
   */
  function searchVendorContacts(searchDTO: VendorSearchCriteriaDTO) : List<AuthorityTargetLookup>{
    var searchCriteria : ContactSearchCriteria
    final var vendorType = searchDTO.VendorType

    if(vendorType == null or (vendorType != typekey.Contact.TC_COMPANYVENDOR && vendorType != typekey.Contact.TC_PERSONVENDOR)){
      throw new DisplayableException(DisplayKey.get("Edge.Web.AuthAdminConsole.NewPortalAuthUserGrantedAuthorityVendorPopup.ReturnedContactsMustBeVendors"))
    }

    return Bundle.resolveInTransaction(\bundle -> {
      searchCriteria = createSearchCriteria(bundle, searchDTO)
      final var resultSpec = new ContactSearchFilter()
      resultSpec.MaxResults = (searchDTO.MaxResults != null) ? searchDTO.MaxResults : DEFAULT_MAX_SEARCH_RESULTS

      final var contactSearchResults = _addressBookAdapter.searchContacts(searchCriteria, resultSpec)

      if (contactSearchResults.NumberOfResults > 10) {
        throw new DisplayableException(DisplayKey.get("Edge.Web.AuthAdminConsole.NewPortalAuthUserGrantedAuthorityVendorPopup.InsufficientSearchCriteria"))
      }
      return contactSearchResults.Contacts.map(
          \contact -> new AuthorityTargetLookup(contact.DisplayName, contact.AddressBookUID))
    }).toList()
  }

  private function createSearchCriteria(bundle : Bundle, searchDTO: VendorSearchCriteriaDTO) : ContactSearchCriteria {
    final var vendorType = searchDTO.VendorType

    if (vendorType == null) {
      throw new gw.api.util.DisplayableException(DisplayKey.get("Edge.Web.AuthAdminConsole.NewPortalAuthUserGrantedAuthorityVendorPopup.MissingVendorType"))
    }

    final var searchCriteria = new ContactSearchCriteria(bundle.PlatformBundle)
    switch(vendorType) {
      case typekey.Contact.TC_COMPANYVENDOR:
          searchCriteria.ContactSubtype = typekey.Contact.TC_COMPANYVENDOR
          searchCriteria.Address.State = searchDTO.State
          searchCriteria.Keyword = searchDTO.Company
          searchCriteria.ExternalSearchEnabled = true
          return searchCriteria
      case typekey.Contact.TC_PERSONVENDOR:
          searchCriteria.ContactSubtype = typekey.Contact.TC_PERSONVENDOR
          searchCriteria.FirstName = searchDTO.FirstName
          searchCriteria.Keyword = searchDTO.LastName
          searchCriteria.Address.State = searchDTO.State
          searchCriteria.ExternalSearchEnabled = true
          return searchCriteria
        default:
        throw new gw.api.util.DisplayableException(DisplayKey.get("Edge.Web.AuthAdminConsole.NewPortalAuthUserGrantedAuthorityVendorPopup.ReturnedContactsMustBeVendors"))
    }
  }
}
