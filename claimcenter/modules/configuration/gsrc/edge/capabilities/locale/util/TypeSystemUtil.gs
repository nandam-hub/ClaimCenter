package edge.capabilities.locale.util

uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem

class TypeSystemUtil {
  public static function getTypeListByName(name: String): IType {
    return TypeSystem.getByFullName("typekey."+name)
  }
}
