package edge.PlatformSupport

class GosuDoc {
    public static function getParamName(doc: Param): String {
      return doc.FieldName()
    }

    public static function getParamDescription(doc: Param): String {
      return doc.FieldDescription()
    }
}
