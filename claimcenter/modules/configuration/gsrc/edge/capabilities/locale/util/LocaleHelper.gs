package edge.capabilities.locale.util

uses gw.api.util.LocaleUtil
uses java.util.Map
uses gw.api.util.CurrencyUtil
uses gw.api.name.NameLocaleSettings
uses gw.api.address.AddressCountrySettings
uses gw.api.util.PhoneUtil
uses java.util.HashMap

class LocaleHelper {

  private static var currencySymbols = new HashMap<String, String>() {
    "aud" -> "$",
    "cad" -> "$",
    "gbp" -> "£",
    "jpy" -> "¥",
    "rub" -> "₽",
    "usd" -> "$",
    "chf" -> "CHF",
    "cny" -> "¥",
    "nzd" -> "$"
  }

  /**
   * A helper function to run a block using the locale and language specified by a a locale string.
   *
   * @param name A string representing the key value for the locale.
   * @param runBlock Code block to run using the specified locale as the default locale.
   */
  public static function runWithLocale(name:String, languageVariant:String, runBlock()) {
    var loc = LocaleType.get(name);
    if ( loc == null ) {
      loc = LocaleUtil.DefaultLocaleType
    }

    var lang : LanguageType
    if ( name != null ) {
      var variantName = name + '_' + languageVariant;

      // Search first for the locale's edge variant
      lang = LanguageType.get(variantName);
      if ( lang == null ) {
        // If no variant found, search for the locale language
        lang = LanguageType.get(name);
        if ( lang == null ) {
          var langPrefix = name.indexOf('_');
          if ( langPrefix > 0 ) {
            name = name.substring(0,langPrefix);
            variantName = name +  '_' + languageVariant;
            lang = LanguageType.get(variantName)
            if ( lang == null ) {
              lang = LanguageType.get(name);
            }
          }
        }
      }
    }

    if ( lang == null ) {
      lang = LocaleUtil.DefaultLanguageType
    }
      LocaleUtil.runAsCurrentLocaleAndLanguage(LocaleUtil.DefaultLocale, LocaleUtil.toLanguage(lang),runBlock)
  }

  public static function forEachLocale(variants: List<String>, runBlock()) {

      var langCodes = LocaleUtil.getAllLanguages().map(\lang -> lang.Code).where( \code -> !code.containsIgnoreCase("_EDG") );

      langCodes.forEach(\langCode -> {
        variants.forEach(\ variant-> runWithLocale(langCode, variant, runBlock))
      })
  }

  public static function getAllLanguages():List<LanguageType> {
    return LocaleUtil.AllLanguages
  }

  private static function getBaseLocaleCode() : String {
    var currentCode = LocaleUtil.CurrentLanguage.Code
    if ( currentCode.containsIgnoreCase("_EDG") ) {
      return currentCode.substring(0,currentCode.length-4)
    } else {
      return currentCode;
    }
  }

  private static function getCurrencySymbol() : String {
    var symbol = currencySymbols.get(CurrencyUtil.DefaultCurrency.Code.toLowerCase())
    return symbol!=null ? symbol : "$"
  }

  private static function getCurrencyCode() : String {
    var code = CurrencyUtil.DefaultCurrency.Code.toLowerCase()
    return code
  }

  public static function getCountrySettings(settings:Map<String,Object>) {
    var country = LocaleUtil.DefaultCountry
    var addressSettings = AddressCountrySettings.getSettings(country)
    settings.put("address", {
        "PostalCodeRegex" -> addressSettings.PostalCodeRegex,
        "pcfMode" -> addressSettings.PCFMode ?: "default",
        "fieldNames" -> addressSettings.VisibleFields*.Name
    })
    settings.put("currency", {
      "symbol" -> getCurrencySymbol(),
      "code" -> getCurrencyCode(),
      "fractionSize" -> (LocaleUtil.CurrentLocale as com.guidewire.commons.metadata.i18n.config.GWLocale).SingleCurrencyFormat.FractionDigits
    })
    settings.put("name",{
      "mode" -> NameLocaleSettings.PCFMode,
      "formatMode" -> NameLocaleSettings.TextFormatMode ?: "default",
      "visibleFields" -> NameLocaleSettings.VisibleFields*.Name
    })
    settings.put("country", {"code"->country.Code,"name"->country.DisplayName})
    settings.put("phone", {
        "sample" -> PhoneUtil.getExamplePhoneNumber(PhoneUtil.UserDefaultPhoneCountry),
        "UserDefaultPhoneCountry"->PhoneUtil.UserDefaultPhoneCountry.Code})
  }
}
