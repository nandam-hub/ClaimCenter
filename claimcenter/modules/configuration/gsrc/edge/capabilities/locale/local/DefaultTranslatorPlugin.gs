package edge.capabilities.locale.local

uses java.util.HashMap
uses java.util.Map
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Exception
uses edge.PlatformSupport.Logger

class DefaultTranslatorPlugin implements ITranslatorPlugin {
  var _displayKeysTranslator : DefaultDisplayKeyTranslatorPlugin
  var _typeKeysTranslator : DefaultTypeKeyTranslatorPlugin
  static var _logger = new Logger("Translator")

  @ForAllGwNodes
  construct(displayKeys:DefaultDisplayKeyTranslatorPlugin, typeKeys:DefaultTypeKeyTranslatorPlugin) {
    _displayKeysTranslator = displayKeys
    _typeKeysTranslator = typeKeys
  }

  protected function translateKey(key: String): String {
    var splitKey = key.split("\\.")
    switch(splitKey[0]){
      case "displaykey":
        return _displayKeysTranslator.translate(key)
      case "typekey":
        return _typeKeysTranslator.translate(key)
      default:
        return null
    }
  }

  override final public function translate(keys: List<String>): Map<String, String> {
    var translatedKeys = new HashMap<String, String>()
    keys.each( \ key -> {
      var translatedKey = doTranslate(key)
      if (translatedKey != null){
        translatedKeys.put(key,translatedKey)
      }
    })
    return translatedKeys
  }

  private function doTranslate(key:String) : String {
    var value = translateKey(key)
    if(value != null){
      return value
    } else {
      _logger.logWarn("Unknown display key during translation: ${key}")
      return null
    }
  }
}
