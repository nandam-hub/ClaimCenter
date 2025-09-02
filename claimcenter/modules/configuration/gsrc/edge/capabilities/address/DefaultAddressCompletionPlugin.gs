package edge.capabilities.address

uses edge.PlatformSupport.Bundle
uses gw.api.contact.AddressAutocompleteUtil
uses edge.capabilities.address.dto.AddressDTO
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Locale
uses edge.util.AddressUtil

/**
 * Common utilities for address completion.
 */
class DefaultAddressCompletionPlugin implements IAddressCompletionPlugin {

  private var _addressPlugin: IAddressPlugin

  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used for address manipulations")
  public construct(addressPlugin: IAddressPlugin) {
    this._addressPlugin = addressPlugin
  }


  override function getAddressFromZipCode(zipCode: String): AddressDTO {
    if (!validateZipCode(zipCode)) {
      throw new IllegalArgumentException("Invalid postal code passed to AddressAutofillHandler")
    }

    return Bundle.resolveInTransaction(\bundle -> {
      final var address = new Address()
      address.PostalCode = zipCode
      address.Country = Locale.DefaultCountry
      AddressAutocompleteUtil.autofillAddress(address, "PostalCode")
        
       /* in PC before 8.0 NeverPersistedBundle is not a child of Bundle so we could not implement QuotingUtil.runInThrowAwayBundle
       */
      final var iter = bundle.InsertedBeans.iterator()
      while (iter.hasNext()) {
        iter.next().remove()
      }

      return _addressPlugin.toDto(address)
    })
  }

  protected function validateZipCode(zipCode: String): boolean {
    if (!zipCode.HasContent) {
      return false
    }
    var postalCodePattern = AddressUtil.getPostalCodePattern()
    return postalCodePattern == null || zipCode.matches(postalCodePattern)
  }
}
