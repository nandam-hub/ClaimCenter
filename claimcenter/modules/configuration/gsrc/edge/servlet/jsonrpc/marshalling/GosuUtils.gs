package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.introspect.AnnotatedField
uses com.fasterxml.jackson.databind.introspect.AnnotatedMember
uses com.fasterxml.jackson.databind.introspect.AnnotatedMethod
uses edge.aspects.validation.annotations.ObservableJsonProperty
uses edge.jsonmapper.JsonReadOnlyProperty
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.ITypeInfo

uses java.lang.RuntimeException

internal class GosuUtils {
  private construct() {
  }

  /**
   * Finds a Gosu property from the member (method/field) detected by Jackson
   */
  static public function findGosuPropertyFor(gosuTypeInfo: ITypeInfo, member: AnnotatedMember): IPropertyInfo {
    var gosuProp: IPropertyInfo
    if (member typeis AnnotatedField) {
      gosuProp = gosuTypeInfo.getProperty(member.Name)
    } else if (member typeis AnnotatedMethod) {
      var methodName = member.Name
      if (methodName.startsWith("get")) {
        gosuProp = gosuTypeInfo.getProperty(methodName.substring(3))
      } else if (methodName.startsWith("is")) {
        gosuProp = gosuTypeInfo.getProperty(methodName.substring(2))
      }
    } else {
      throw new RuntimeException("Unsupported annotated member")
    }
    return gosuProp
  }

  public static function isPropertyDeclaredByIGosuObject(p:IPropertyInfo): boolean {
    return
        p.OwnersType.Name == "_proxy_.gw.lang.reflect.gs.IGosuObject" ||
        p.OwnersType.Name == "gw.lang.reflect.gs.IGosuObject" ||
        p.OwnersType.Name == "java.lang.Object"
  }

  public static function isPropertyJsonReadOnlyProperty(p:IPropertyInfo): boolean {
    return p.Annotations.hasMatch( \ annot -> annot.Type == JsonReadOnlyProperty)
  }

  public static function isPropertyObservable(p:IPropertyInfo): boolean {
    return p.Annotations.hasMatch( \ annot -> annot.Type == ObservableJsonProperty)
  }

  public static function getPropertyValue(obj:Object, propName:String): Object {
    var gosuPropName = propName.substring(0, 1).toUpperCase() + propName.substring(1)
    return obj[gosuPropName]
  }
}
