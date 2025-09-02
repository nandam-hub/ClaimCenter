package edge.el.typing

uses gw.lang.reflect.IType
uses java.lang.IllegalArgumentException
uses java.lang.Integer
uses java.lang.Long
uses java.math.BigDecimal
uses java.util.Map
uses gw.lang.reflect.IPropertyInfo
uses edge.el.interop.GosuInterop
uses gw.lang.reflect.IMethodInfo
uses edge.PlatformSupport.Reflection
uses gw.entity.ITypeList
uses edge.el.DynamicValue
uses java.util.Date
uses gw.lang.reflect.TypeSystem

/** Type system used in the expression language. This class provides different factories to be used to evaluate
 * type of the expression.
 */
final class ExpressionTypeSystem {

  /** Type of the dynamic expression (i.e. no detailed type information is known during compilation). */
  public static final var DYNAMIC_TYPE : ExpressionType = new ExpressionType(null)


  /** Supported constant types. */
  private static final var CONST_TYPES : Map<String, IType> = {
      "int" -> Integer,
      "long" -> Long,
      "BigDecimal" -> BigDecimal,
      "Date" -> Date,
      "string" -> String,
      "boolean" -> Boolean,
      "null" -> Object
  }


  /** Returns a representation of the dynamic type. */
  static function dynamic() : ExpressionType {
    return DYNAMIC_TYPE
  }


  /** Checks if type is dynamic (i.e. is not known in the bulid time). */
  static function isDynamic(t : ExpressionType) : Boolean {
    return t.GosuType == null
  }


  /** Calculates a type of the argument.
   * @throws IllegalArgumentException if argument index is out of range.
   */
  static function argType(argTypes : IType[], argIdx : int) : ExpressionType {
    if (argIdx < 0 || argIdx >= argTypes.length) {
      throw new IllegalArgumentException("Argument index " + argIdx + " is outside of the available range of 0.." + argTypes.length)
    }

    return new ExpressionType(argTypes[argIdx])
  }


  /** Returns type of the constant. */
  static function constType(value : Object, declaredType : String) : ExpressionType {
    if (value == null && "null".equals(declaredType)) {
      return dynamic()
    }
    if (declaredType == "dto") {
      return fromGosuType(typeof(value))
    }
    final var constClass = CONST_TYPES.get(declaredType)
    if (constClass != null) {
      if (!GosuInterop.isCallAssignable(constClass, typeof(value))) {
        throw new IllegalArgumentException("Constant type " + typeof(value) + " does not match declared type "+ declaredType)
      }

      return fromGosuType(typeof(value))
    }

    if (declaredType.startsWith("enum ")) {
      final var enumTypeName = declaredType.substring("enum ".length);
      final var gosuType = TypeSystem.getByFullNameIfValid(enumTypeName)
      if (!gosuType.Enum) {
        throw new IllegalArgumentException("Illegal enum type name " + enumTypeName)
      }

      return fromGosuType(gosuType)
    }

    if (declaredType.startsWith("typekey ")) {
      final var typelistTypeName = "typekey." + declaredType.substring("typekey ".length)
      final var gosuType = TypeSystem.getByFullNameIfValid(typelistTypeName)
      if (!(gosuType typeis ITypeList)) {
        throw new IllegalArgumentException("Illegal typelist type " + typelistTypeName)
      }

      return fromGosuType(gosuType)
    }

    throw new IllegalArgumentException("Unsupported constant declared type " + declaredType)
  }


  /** Returns type of property access on the object. */
  static function propType(base : ExpressionType, prop: IPropertyInfo) : ExpressionType {
    return isDynamic(base) ? DYNAMIC_TYPE : fromGosuType(Reflection.getPropertyType(prop))
  }


  /** Returns type of dynamic property access on the object. */
  static function propType(base : ExpressionType, prop: String) : ExpressionType {
    return DYNAMIC_TYPE
  }


  /** Returns type of the call to the "function-like" entity. */
  static function callType(entityName: String, retType : ExpressionType, argTypes : IType[], actualArgTypes : ExpressionType[]) : ExpressionType {
    if (argTypes.length != actualArgTypes.length) {
      throw new IllegalArgumentException("Wrong number of arguments to " + entityName + ", expected " + argTypes.length + " but got " + actualArgTypes.length)
    }

    var ptr = 0
    while (ptr < argTypes.length) {
      final var argType = argTypes[ptr]
      final var actualType = actualArgTypes[ptr]
      ptr += 1

      if (!isDynamic(actualType) && !GosuInterop.isCallAssignable(argType, actualType.GosuType)) {
        throw new IllegalArgumentException("Bad argument type in position " + ptr + " to " + entityName + ", expected " + argType + " but got " + actualType.GosuType)
      }
    }

    return retType
  }


  /** Returns a type of the "translation" invocation.
   * @param argTypes types of the arguments passed into the translation.
   */
  static function translateType(argTypes : ExpressionType[]) : ExpressionType {
    return fromGosuType(String)
  }


  /** Returns type of the call to the static gosu function. */
  static function staticCallType(method : IMethodInfo, actualArgTypes : ExpressionType[]) : ExpressionType {
    final var realReturnType = Reflection.hasAnnotation(method, DynamicValue) ? DYNAMIC_TYPE : fromGosuType(method.ReturnType)
    return callType(
        "Method " + method.Name + " on " + method.Container.Name,
        realReturnType,
        method.Parameters.map( \ elt -> Reflection.getParamType(elt)),
        actualArgTypes)
  }


  /** Defines a type of the reduce operation on the elements.  */
  static function reduceType(opName : String, reduceDomain : IType, actualArgTypes : ExpressionType[]) : ExpressionType {
    var ptr = 0
    while (ptr < actualArgTypes.length) {
      final var actualType = actualArgTypes[ptr]
      ptr += 1

      if (!isDynamic(actualType) && !GosuInterop.isCallAssignable(reduceDomain, actualType.GosuType)) {
        throw new IllegalArgumentException("Bad argument type in position" + (ptr + 1) + " to " + opName + ", expected " + reduceDomain + " but got " + actualType)
      }
    }

    return fromGosuType(reduceDomain)
  }


  /**
   *  Creates a new representation of the gosu type.
   */
  static function fromGosuType(gosuType : IType) : ExpressionType {
    if (gosuType == null) {
      throw new IllegalArgumentException("Gosu type could not be null")
    }
    return new ExpressionType(gosuType)
  }


}
