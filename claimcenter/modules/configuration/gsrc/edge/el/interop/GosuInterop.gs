package edge.el.interop

uses gw.lang.reflect.IType
uses java.lang.IllegalArgumentException
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IMethodInfo
uses java.lang.Byte
uses java.lang.Short
uses java.lang.Character
uses java.util.Map
uses java.lang.Integer
uses java.lang.Long
uses java.lang.Float
uses java.lang.Double
uses edge.util.MapUtil
uses edge.el.compilation.CompilationResult
uses gw.lang.reflect.TypeSystem

/** Interoperability functions to be used with the Gosu language. */
final class GosuInterop {

  /** Box types for primitive types. */
  private static final var BOX_TYPES : Map<IType, IType> = {
    byte -> Byte,
    short -> Short,
    char -> Character,
    int -> Integer,
    long -> Long,
    float -> Float,
    double -> Double,
    boolean -> Boolean
  }

  /**
   * Retrieves a gosu property accessor that should be used to access a named property on the given expression type.
   */
  static function gosuPropertyAccessor(parentType : IType, propertyName : String) : IPropertyInfo {
    final var props = parentType.TypeInfo.Properties.where( \ elt -> elt.Name == propertyName)
    if (props.Empty) {
      throw new IllegalArgumentException("No property " + propertyName + " is defined on the type " + parentType.Name)
    }

    if (props.size() > 1) {
      throw new IllegalArgumentException("Ambigious property " + propertyName + " is defined on the type " + parentType.Name)
    }

    return props[0]
  }


  /** Checks if <code>fromType</code> could be passed as an argument to toType. */
  static function isCallAssignable(toType  : IType, fromType : IType) : Boolean {
    if (toType.isAssignableFrom(fromType)) {
      return true
    }

    if (possibleBox(toType).isAssignableFrom(possibleBox(fromType))) {
      return true
    }

    return false
  }


  /** Returns a possible box type for the type .*/
  private static function possibleBox(type : IType) : IType {
    return MapUtil.getOrDefault(BOX_TYPES, type, type)
  }

  /** Returns a callable static method. */
  public static function getStaticMethod(base : IType, methodName : String, methodArgs : CompilationResult[]) : IMethodInfo {
    final var methods = base.TypeInfo.Methods.where( \ elt -> elt.DisplayName == methodName && elt.Parameters.length == methodArgs.length)
    if (methods.Empty) {
      throw new IllegalArgumentException("Could not find method " + methodName + " on " + base.Name)
    }
    if (methods.size() > 1) {
      throw new IllegalArgumentException("Too many methods with name" + methodName + " on " + base.Name)
    }
    final var meth = methods.get(0)
    if (!meth.Static) {
      throw new IllegalArgumentException("Could not call non-static method " + methodName + " on " + base.Name)
    }
    if (!meth.Public) {
      throw new IllegalArgumentException("Could not call non-public method " + methodName + " on " + base.Name)
    }
    return meth
  }


  /** Finds a list of overloads to be used with the arguments. */
  public static reified function findOverload<T>(entityName : String, items: T[], argFuncs(item : T) : IType[], argTypes : IType[]) : T {
    final var eligibleOverloads = items.where( \ elt -> isOverloadCompatible(argFuncs(elt), argTypes))
    if (eligibleOverloads.length != 1) {
      throw new IllegalArgumentException("Could not find an unique overload for " + entityName + " with types (" + argTypes.map( \ elt -> elt.Name).join(",") + ")")
    }
    return eligibleOverloads[0]
  }


  /** Checks if actual types are compatible with the overload. */
  private static function isOverloadCompatible(args: IType[], actualTypes : IType[]) : Boolean {
    if (args.length != actualTypes.length) {
      return false
    }

    var ptr = 0
    while (ptr < args.length) {
      final var arg = args[ptr]
      final var actualType = actualTypes[ptr]
      ptr += 1
      if (!isCallAssignable(arg, actualType)) {
        return false
      }
    }

    return true
  }


  /** Returns a callable method static method. */
  public static function getStaticMethod(base : String, methodName : String, methodArgs : CompilationResult[]) : IMethodInfo {
    final var hostType = TypeSystem.getByFullNameIfValid(base)
    if (hostType == null) {
      throw new IllegalArgumentException("Invalid type name " + base);
    }
    return getStaticMethod(hostType, methodName, methodArgs)
  }

}
