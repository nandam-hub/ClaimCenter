package gw.plugin.contact.ab5040

uses entity.Contact
uses gw.api.contact.ContactSystemContactNotFoundException
uses gw.api.contact.ContactSystemPluginAdapter
uses gw.api.locale.DisplayKey
uses gw.api.util.LocaleUtil
uses gw.contactmapper.ab5040.ContactIntegrationMapperFactory
uses gw.plugin.contact.InsuranceCompanySearchPlugin
uses gw.plugin.contact.search.ContactSearchResult
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.ABContactAPI
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.anonymous.elements.ABContactAPISearchCriteria_OfficialIDs_Entry
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.anonymous.types.complex.ABContactAPISearchCriteria_OfficialIDs
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.anonymous.types.complex.ABContactAPISearchCriteria_Tags
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.types.complex.ABContactAPISearchCriteria
uses wsi.remote.gw.webservice.ab.ab5040.abcontactapi.types.complex.ABContactAPISearchSpec

/**
 * Implementation of <code>InsuranceCompanySearchPlugin</code> for integration
 * with Guidewire ContactManager.
 * <p>
 * Note that the Contacts returned from searchBy*() functions
 * as part of the ContactSearchResult is not complete representations of the Contacts in ContactManager.
 * For performance reasons only some of the Contact data is provided by ContactManager for these
 * methods. Please see the ContactSearchResultMapper class to see what data is
 * send from ContactManager and mapped to these Contacts.
 * For example, OfficialIDs array is not included in these results.
 */
@Export
class ABInsuranceCompanySearchPlugin implements InsuranceCompanySearchPlugin {

  private final var _pluginHelper = new gw.plugin.contact.ab5040.ContactPluginHelper()

  override function searchByOfficialID(officialIDType : OfficialIDType, officialIDValue : String, jurisdiction : Jurisdiction) : ContactSearchResult {
    var searchCriteria = addOfficialIDConditionToCriteria(AbContactAPISearchCriteria, officialIDType, officialIDValue, jurisdiction)
    return getContactSearchResult(searchCriteria)
  }

  override function searchByOfficialIDType(officialIDType : OfficialIDType, jurisdiction : Jurisdiction) : ContactSearchResult {
    var searchCriteria = addOfficialIDConditionToCriteria(AbContactAPISearchCriteria, officialIDType, null, jurisdiction)
    return getContactSearchResult(searchCriteria)
  }

  override function searchByTag(tagType : ContactTagType, officialIDType : OfficialIDType, jurisdiction : Jurisdiction) : ContactSearchResult {
    var searchCriteria = addTagConditionToCriteria(AbContactAPISearchCriteria, tagType)
    if (officialIDType != null) { // If officialIDType is not given, jurisdiction cannot be used as filter due to the validation check
      searchCriteria = addOfficialIDConditionToCriteria(searchCriteria, officialIDType, null, jurisdiction)
    }
    return getContactSearchResult(searchCriteria)
  }

  override function retrieveInsuranceCompany(officialIDType : OfficialIDType, officialIDValue : String, jurisdiction : Jurisdiction) : InsuranceCompany {
    var searchResult = searchByOfficialID(officialIDType, officialIDValue, jurisdiction)
    var numberOfResults = searchResult.NumberOfResults
    if (numberOfResults == 0) {
      throw new IllegalArgumentException(DisplayKey.get("Web.Plugin.InsuranceCompanySearch.ContactNotFound"))
    } else if (numberOfResults != 1) {
      throw new IllegalArgumentException(DisplayKey.get("Web.Plugin.InsuranceCompanySearch.NotUniqueConditionError"))
    }
    var abUID = searchResult.Contacts.first().AddressBookUID
    return retrieveInsuranceCompany(abUID)
  }

  override function retrieveInsuranceCompany(abUID : String) : InsuranceCompany {
    var contact : Contact
    try {
      contact = ContactSystemPluginAdapter.getAdapter().retrieveContact(abUID)
    } catch (notFoundExp : ContactSystemContactNotFoundException) {
      throw new IllegalArgumentException(DisplayKey.get("Web.Plugin.InsuranceCompanySearch.ContactNotFound"), notFoundExp)
    }
    if (contact typeis InsuranceCompany) {
      return contact
    } else {
      throw new IllegalArgumentException(DisplayKey.get("Web.Plugin.InsuranceCompanySearch.ContactIsNotInsuranceCompany"))
    }
  }

  private property get AbContactAPISearchCriteria() : ABContactAPISearchCriteria {
    var searchCriteriaInfo = new ABContactAPISearchCriteria()
    searchCriteriaInfo.ContactType = ContactIntegrationMapperFactory.mapper().NameMapper.getABEntityName("InsuranceCompany")
    return searchCriteriaInfo;
  }

  private property get ContactAPI() : ABContactAPI {
    var api = new ABContactAPI()
    api.Config.Guidewire.Locale = LocaleUtil.CurrentLanguage.toString()
    return api
  }

  private function addOfficialIDConditionToCriteria(searchCriteria : ABContactAPISearchCriteria, officialIDType : OfficialIDType, officialIDValue : String, jurisdiction : Jurisdiction) : ABContactAPISearchCriteria {
    searchCriteria.OfficialIDs.$TypeInstance = new ABContactAPISearchCriteria_OfficialIDs()
    searchCriteria.OfficialIDs.Entry.add(createOfficialIdCriteriaEntry(officialIDType, officialIDValue, jurisdiction))
    return searchCriteria
  }

  private function addTagConditionToCriteria(searchCriteria : ABContactAPISearchCriteria, tagType : ContactTagType) : ABContactAPISearchCriteria {
    searchCriteria.Tags.$TypeInstance = new ABContactAPISearchCriteria_Tags()
    searchCriteria.Tags.Entry.add(tagType.Code)
    return searchCriteria
  }

  private function getContactSearchResult(searchCriteria : ABContactAPISearchCriteria) : ContactSearchResult {
    var result = ContactAPI.searchContact(searchCriteria, new ABContactAPISearchSpec())
    return _pluginHelper.toSearchResult(result, false)
  }

  private function createOfficialIdCriteriaEntry(type : OfficialIDType, value : String, jurisdiction : Jurisdiction) : ABContactAPISearchCriteria_OfficialIDs_Entry {
    var entry = new ABContactAPISearchCriteria_OfficialIDs_Entry()
    entry.OfficialIDType = type.Code
    entry.OfficialIDValue = value
    entry.State = jurisdiction?.Code

    return entry
  }
}
