package edge.capabilities.locale.local

uses edge.PlatformSupport.TranslateUtil
uses edge.di.annotations.ForAllGwNodes

class DefaultDisplayKeyTranslatorPlugin {

  @ForAllGwNodes
  construct() {
  }

  function translate(key: String): String {
    return getDisplayKeyValue(key)
  }

  function translate(key: String, args: String[]): String {
    return getDisplayKeyValue(key)
  }

  private function getDisplayKeyValue(key: String): String{
    var displayKey = removeDisplayKeyIdentifier(key)
    var translationResult = TranslateUtil.translate(displayKey)
    var translationDoesNotExist = translationResult == displayKey

    return translationDoesNotExist ? null : translationResult
  }

  private function removeDisplayKeyIdentifier(key: String): String {
    return key.split("displaykey.")[1]
  }
}
