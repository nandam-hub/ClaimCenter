package edge.PlatformSupport

uses gw.api.locale.DisplayKey

class EdgeDisplayKey {

  static function getDisplayKey(displayKeyId: String, params: Object[]): String {
      return DisplayKey.get(displayKeyId, params)
  }

  static function getDisplayKey(displayKeyId: String): String {
        return DisplayKey.get(displayKeyId)
  }
}
