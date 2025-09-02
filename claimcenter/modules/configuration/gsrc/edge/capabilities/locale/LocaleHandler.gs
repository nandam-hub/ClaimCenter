package edge.capabilities.locale

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses java.util.Map
uses edge.di.annotations.InjectableNode
uses java.util.HashMap
uses edge.capabilities.locale.local.ITranslatorPlugin
uses gw.api.util.LocaleUtil
uses edge.capabilities.locale.util.LocaleHelper
uses edge.PlatformSupport.Locale

class LocaleHandler extends AbstractRpcHandler {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(LocaleHandler))
  final private static var LANGUAGE_VARIANTS_SUFFIXES = { 'EDG', 'EDG_PH'}
  var _translator : ITranslatorPlugin

  @InjectableNode
  construct(aTranslator:ITranslatorPlugin) {
    _translator = aTranslator
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Retrieves the localization settings to be used.")
  @ApidocAvailableSince("5.0")
  public function getLocaleConfig() : Map<String,Object> {
    var locales = getLanguages()
    var result = new HashMap<String,Object>() {
      "locales" -> locales,
      "fallbackLocale" -> Locale.DefaultLanguage.Code,
      "preferredLocale" -> Locale.DefaultLanguage.Code
    }
    LocaleHelper.getCountrySettings(result)
    return result
  }

  /**
   * Display keys to translate
   * Returns a map of key => translation
   */
  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Returns translated value for the list of display keys submitted in the locale specified. " +
      "NOTE: Please note that the translate service works with both displaykeys and typekeys; to this end you must prefix the " +
      "label or item that you wish to translate with either displaykey or typeket as illustrated in the example")
  @ApidocAvailableSince("5.0")
  public function translate(locale: String, languageVariant: String, keys: List<String>): Map<String, String> {
    var translations: Map<String, String>
    LocaleHelper.runWithLocale(locale, languageVariant, \-> {
      translations = _translator.translate(keys)
    })
    return translations
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Returns translated value for the list of display keys submitted for all the available languages and edge variants." +
      "NOTE: Please note that the translate service works with both displaykeys and typekeys; to this end you must prefix the " +
      "label or item that you wish to translate with either displaykey or typeket as illustrated in the example")
  @ApidocAvailableSince("11.0")
  public function translateForAllLanguages(keys: List<String>): Map<String, Map<String, String>> {
    var langMap = new HashMap<String, Map<String, String>>();

    LocaleHelper.forEachLocale(LANGUAGE_VARIANTS_SUFFIXES, \ -> {
        var currentCode = LocaleUtil.CurrentLanguage.Code;
        langMap.put(currentCode, _translator.translate(keys));
    })
    return langMap;
  }

  private function getLanguages(): Map<String,String> {
    var locales = new HashMap<String,String>()
    LocaleUtil.getAllLanguages()
        .where( \ l -> !l.Code.containsIgnoreCase("_EDG") )
        .each( \ l -> locales.put(l.Code, l.DisplayName) )
    return locales
  }

}
