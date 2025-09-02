package edge.PlatformSupport

uses java.util.regex.Pattern

/**
 * Provides helper functions to retrieve translations.
 */
class TranslateUtil {
  public static function translate(displayKey: String): String {
    return gw.api.locale.DisplayKey.get(namespaceDisplayKey(displayKey))
  }

  public static function translate(displayKey: String, argValues: Object[]) : String {
    return gw.api.locale.DisplayKey.get(namespaceDisplayKey(displayKey), argValues)
  }

  private static function namespaceDisplayKey(displayKey:String) : String {
      var namespaceMatcher = Pattern.compile("edge(v[a-z0-9]*)?").matcher(displayKey)
      if (namespaceMatcher.find()){
        displayKey = displayKey.replaceAll("Edge.", namespaceMatcher.group().capitalize()+".")
      }
      return displayKey
    }
}
