package edge.PlatformSupport
uses gw.lang.reflect.IType
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.ITypeInfo
uses gw.lang.reflect.IMethodInfo
uses gw.lang.reflect.ReflectUtil
uses gw.entity.TypeKey
uses java.util.Collection
uses gw.entity.ITypeList
uses java.util.ArrayList
uses gw.lang.reflect.IAnnotationInfo
uses gw.lang.reflect.IConstructorInfo
uses gw.lang.reflect.IParameterInfo
uses gw.lang.reflect.TypeSystem

class Reflection {
  public static function isTypeAnArray(type : IType) : boolean{
    return type.Array
  }

  public static function hasAnnotation(prop : IPropertyInfo, annotationType : IType) : boolean{
    return prop.Annotations.hasMatch(\ a -> (typeof a.Instance) == annotationType)
  }

  public static function getAnnotation(prop : IPropertyInfo, annotationType : IType) : IAnnotation{
    for(annot in prop.Annotations){
      if(typeof( annot.Instance) == annotationType){
        return annot.Instance as IAnnotation
      }
    }
    return null
  }

  public static function getAnnotation(method : IMethodInfo, annotationType : IType) : IAnnotation{
    for(annot in method.Annotations){
      if(typeof( annot.Instance) == annotationType){
        return annot.Instance as IAnnotation
      }
    }
    return null
  }

  public static function getAnnotations(prop : IPropertyInfo) : List<IAnnotation> {
    return prop.Annotations
      .where(\ann -> ann.Instance typeis IAnnotation)
      .map(\ann -> ann.Instance as IAnnotation)
  }

  public static function getAnnotations(type : IType) : List<IAnnotation> {
    return type.TypeInfo.Annotations
        .where(\ann -> ann.Instance typeis IAnnotation)
        .map(\ann -> ann.Instance as IAnnotation)
  }

  public static reified function TypeInfo<T>():ITypeInfo{
    return T.Type.TypeInfo
  }

  public static function getMethodName(method : IMethodInfo) : String{
    return method.DisplayName
  }

  public static function hasAnnotation(method : IMethodInfo, annotationType : IType) : boolean{
    return method.hasAnnotation(annotationType)
  }

  public static reified function getRelativeName<T>(t:Type<T>) : String {
    return t.RelativeName
  }

  public static function invokeMethod(instance : Object, methodName : String, params : Object[]) : Object{
    return ReflectUtil.invokeMethod(instance, methodName, params)
  }

  public static function getTypeKeysByFilterName(value : TypeKey, filterName : String) : Collection {
    return ((typeof value) as ITypeList).getTypeKeysByFilterName(filterName)
  }

  public static reified function ArrayType<T>() : IType{
    return T.Type
  }

  public static function getPropertyType(item : IPropertyInfo) : IType {
    return item.FeatureType
  }

  public static function getParamType(item : IParameterInfo) : IType {
    return item.FeatureType
  }

  public static reified function newInstance<T>(t:Type<T>):T {
    return t.TypeInfo.getConstructor({}).Constructor.newInstance({}) as T
  }

  public static function subtypes(t : IType) : List<IType> {
    return t.TypeLoader.AllTypeNames
        .map(\ n -> TypeSystem.getByFullNameIfValid(n.toString()))
        .where(\c -> t.isAssignableFrom(c))
  }

  /** Returns value of the annotation. */
  public static function annotationValue(annot : IAnnotationInfo) : Object {
    return annot.Instance
  }

  public static function getAnnotations(cons : IConstructorInfo, annot : IType) : List<IAnnotationInfo> {
    return cons.getAnnotationsOfType(annot)
  }

  public static function getAnnotationValues(cons : IConstructorInfo, annot : IType) : List<Object> {
    return getAnnotations(cons, annot).map(\x -> annotationValue(x))
  }

  public static function allAnnotationTypes(cons : IConstructorInfo) : Collection<IType> {
    return cons.Annotations.map(\ i -> i.Type)
  }

  public static function getGenericType(t : IType) : IType {
    return t.GenericType;
  }
}
