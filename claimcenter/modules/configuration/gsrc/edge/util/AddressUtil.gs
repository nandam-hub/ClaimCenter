package edge.util

uses gw.api.address.AddressCountrySettings
uses edge.PlatformSupport.Locale

/**
 * Utilities for address related tasks.
*/
class AddressUtil {
  /**
   * Returns postal code pattern
   * @return postal code pattern for the default country or <code>null</code> if postal code pattern is
   *   not defined for the default country.
   */
  public static function getPostalCodePattern(): String {
    return AddressCountrySettings.getSettings(Locale.DefaultCountry).PostalCodeRegex
  }
}
