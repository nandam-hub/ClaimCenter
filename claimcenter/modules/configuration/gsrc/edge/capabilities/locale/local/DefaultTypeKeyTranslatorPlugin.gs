package edge.capabilities.locale.local

uses gw.lang.reflect.IType
uses java.lang.Exception
uses gw.entity.ITypeList
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.locale.util.TypeSystemUtil

class DefaultTypeKeyTranslatorPlugin {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultTypeKeyTranslatorPlugin))
  @ForAllGwNodes
  construct() {
  }

  function translate(key: String): String {
    // split the TypeKey type and code
    var typeList = removeTypeKeyIdentifier(key).split("\\.").toList()
    var type: IType
    try {
      type = TypeSystemUtil.getTypeListByName(typeList.remove(0))
    } catch (e: Exception) {
      return null
    }
    var code: String
    // code contains one or more '.'
    if (typeList.size() > 1) {
      code = typeList.join(".")
    } else {
      code = typeList[0]
    }
    return (type as ITypeList).getTypeKey(code).DisplayName
  }

  private function removeTypeKeyIdentifier(key: String): String {
    return key.split("typekey.")[1]
  }
}
