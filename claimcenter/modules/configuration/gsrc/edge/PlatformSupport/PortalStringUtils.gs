package edge.PlatformSupport

uses java.lang.CharSequence
uses java.lang.Character

class PortalStringUtils {

  public static function isBlank(cs:CharSequence):boolean {
    if (cs == null || cs.length() == 0) {
      return true
    }

    for (var i in 0 .. cs.length()) {
      if (!Character.isWhitespace(cs.charAt(i))) {
        return false
      }
    }
    return true
  }

  public static function notBlank(str:String):boolean {
    return str.NotBlank
  }

}
