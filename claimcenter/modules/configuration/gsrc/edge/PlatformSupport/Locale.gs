package edge.PlatformSupport

uses gw.i18n.ILocale
uses gw.api.util.LocaleUtil

class Locale {
  /**
   * A helper function to run a block using the locale and language specified by a a locale string.
   *
   * @param name A string representing the key value for the locale.
   * @param runBlock Code block to run using the specified locale as the default locale.
   */
  public static function runWithLocale(name:String, runBlock()) {
    final var lang = getLanguageForLocale(name)
    LocaleUtil.runAsCurrentLanguage(LocaleUtil.toLanguage(lang),runBlock)
  }



  private static function getLanguageForLocale(name : String) : LanguageType {
    if (name == null) {
      return LocaleUtil.DefaultLanguageType
    }

    final var fullNameLanguage = getMaybeEdgeLanguage(name)
    if (fullNameLanguage != null) {
      return fullNameLanguage
    }

    // Try with shorter name (without a country).
    final var langPrefix = name.indexOf('_');
    if ( langPrefix > 0 ) {
      final var shortNameLanguage = getMaybeEdgeLanguage(name.substring(0,langPrefix))
      if (shortNameLanguage != null) {
        return shortNameLanguage
      }
    }

    // No luck, client is using something strange and unknown. Maybe older portal version (after a language was removed).
    return LocaleUtil.DefaultLanguageType
  }


  /** Searches for both name_edge and name languages and returns first found.
   * Returns language type or null if no matching language was found.
   */
  public static function getMaybeEdgeLanguage(name : String) : LanguageType {
    // Search first for the locale's edge variant
    final var edgeLang = LanguageType.get(name+"_edg")
    if (edgeLang != null) {
      return edgeLang
    }

    // If no variant found, search for the locale language
    final var rawLang = LanguageType.get(name);
    if (rawLang != null) {
      return rawLang
    }

    return null
  }


  public static function getBaseLocaleCode() : String {
    var currentCode = LocaleUtil.CurrentLanguage.Code
    if ( currentCode.endsWith("_edg") ) {
      return currentCode.substring(0,currentCode.length-4)
    } else {
      return currentCode;
    }
  }

  public static property get DefaultCountry():Country {
    return LocaleUtil.DefaultCountry
  }

  public static property get DefaultLanguage():LanguageType {
    return LocaleUtil.DefaultLanguageType
  }

}
