package edge.el

uses edge.el.dto.ExpressionDTO
uses edge.el.dto.ParameterExpressionDTO
uses java.lang.IllegalArgumentException
uses edge.el.dto.NativeCallExpressionDTO
uses edge.el.dto.FieldAccessExpressionDTO
uses edge.el.dto.ConstantExpressionDTO
uses java.math.BigDecimal
uses java.lang.Integer
uses gw.lang.reflect.IType
uses java.lang.Long
uses java.lang.Enum
uses edge.el.dto.TranslateDTO
uses gw.entity.TypeKey
uses java.util.Date
uses java.util.regex.Pattern

/**
 * Expression factories. Users should use this class instead of creating Expression DTOs directly. DTO structure is
 * not guaranteed to be stable or backward compatible even between sequential releases. This API is intended to be
 * compatible between releases where it is possible.
 */
class Expr {

  /** Creates a new parameter access expression.
   * @param idx parameter index. Must not be negative.
   */
  public static function param(idx : int) : ExpressionDTO {
    return new ParameterExpressionDTO(idx);
  }


  /**
   * Creates a "method call" expression for the named method on the type.
   * Frontend (or other user) should register a method to be available to the execution environment.
   *
   * @param base type defining a method.
   * @param methodName name of the method on the type. Method must be static and public.
   *
   * @param args expressions to pass as arguments into the method.
   */
  public static function call(base : IType, methodName : String, args : Object[]) : ExpressionDTO {
    return new NativeCallExpressionDTO(base.Name, methodName, args.map(\arg -> asExpression(arg)))
  }


  /** Returns a property access expression. */
  public static function getProperty(propName : String, base : ExpressionDTO) : ExpressionDTO {
    final var elements = propName.split("\\.");
    var cur = base
    for (var step in elements) {
      cur = new FieldAccessExpressionDTO(cur, step)
    }
    return cur
  }

  /** Creates a numeric constant. */
  public static function const(value : long) : ExpressionDTO {
    return new ConstantExpressionDTO("long", value)
  }

  /** Creates a numeric constant. */
  public static function const(value : int) : ExpressionDTO {
    return new ConstantExpressionDTO("int", value)
  }

  /** Creates a boolean constant. */
  public static function const(value : boolean) : ExpressionDTO {
    return new ConstantExpressionDTO("boolean", value)
  }

  /** Creates a numeric constant. */
  public static function const(value: BigDecimal) : ExpressionDTO {
    return new ConstantExpressionDTO("BigDecimal", value)
  }

  /** Creates a numeric constant. */
  public static function const(value: Date) : ExpressionDTO {
    return new ConstantExpressionDTO("Date", value)
  }

  /** Creates a string constant. */
  public static function const(value : String) : ExpressionDTO {
    return new ConstantExpressionDTO("string", value)
  }

  /** Creates a enum constant. */
  public static reified function const<T extends Enum<T>>(value : T) : ExpressionDTO {
    return new ConstantExpressionDTO("enum " + T.Type.Name, value.name())
  }


  /** Creates a typecode constant. */
  public static function const(v : TypeKey) : ExpressionDTO {
     if (v == null) {
       return constNull()
     }

    final var t = typeof(v)
    final var typelistName = t.Name.substring("typekey.".length)
    return new ConstantExpressionDTO("typekey " + typelistName, v.Code)
  }

  /** Representation of the <code>null</code>. This could not be robustly created using
   * <code>const(null)</code> as it is ambiguous and there is no notion of bottom (or null) type in gosu type system so
   * specific overload for the null is not possible. Note that <code>const(x)</code> would compile successfully when
   * x have a correct type (string or enum) so there is no need for explicit null check to retrieve this constant.
   * <p>Note that we could not use "Null" property as on older case-insensitive platforms it would be considered as
   * a <code>null</code> value and not the property name.
   * </p>
   */
  public static function constNull() : ExpressionDTO {
    return new ConstantExpressionDTO("null", null)
  }

  /** Creates a "DTO" constant. This constant could be any type supported by the DTO serializer. I.e. it could be a
   * map, array or complex object. Note that on the backend this constant would be representend as an
   * <em>unparsed</em> JSON object. For example, typekeys would be represented as strings (however, on the backend it
   * would be a typekey). Same for dates: date would be a string on the frontend but date on the backend. Given this
   * restrictions, in most use-cases DTO constants should be used as arguments to customer's methods only. They should
   * not be used in more complex expressions. This is sill useful as lookup tables could be encoded only once (but
   * lookup functions using those tables have to be implemented on both backend and frontend).
   */
  public static function dtoConst(v : Object) : ExpressionDTO {
    return new ConstantExpressionDTO("dto", v)
  }


  /**
   * Tries to treat a value as an expression. It would be a constant expression if value is constant. It would be
   * a value itself if value is an expression DTO. This method could be user to write expressions in shorter way and
   * make method implementations simpler.
   * <p>Note that this method does not "parse" expression. It treats value as an expression. So strings would be
   * treated as string constants and not a definition of the expression.</p>
   */
  public static function asExpression(value : Object) : ExpressionDTO {
    if (value == null) {
       return constNull()
    }

    if (value typeis ExpressionDTO) {
      return value
    }

    if (value typeis Integer) {
      return const(value)
    }

    if (value typeis Long) {
      return const(value)
    }

    if (value typeis Boolean) {
      return const(value)
    }

    if (value typeis BigDecimal) {
      return const(value)
    }

    if (value typeis Date) {
      return const(value)
    }

    if (value typeis String) {
      return const(value)
    }

    if (value typeis TypeKey) {
      return const(value)
    }

    if (value typeis Boolean) {
      return const(value)
    }

    throw new IllegalArgumentException("Could not treat " + typeof(value) + " as an expression")
  }


  /* OPERATORS. */

  /**
   * Creates a new equality comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function eq(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "eq", {asExpression(arg1), asExpression(arg2)})
  }

  /**
   * Creates a new inequality comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function neq(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "neq", {asExpression(arg1), asExpression(arg2)})
  }

  /**
   * Creates a new "lessThan" comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function lessThan(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "less", {asExpression(arg1), asExpression(arg2)})
  }

  /**
   * Creates a new "greaterThan" comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function greaterThan(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "greater", {asExpression(arg1), asExpression(arg2)})
  }

  /**
   * Creates a new "lessThanOrEqual" comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function lessThanOrEqual(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "lessOrEqual", {asExpression(arg1), asExpression(arg2)})
  }

  /**
   * Creates a new "greaterThanOrEqual" comparison expression for two expressions.
   * @param arg1 first argument. Could be an expression or constant (string, int, etc...)
   * @param arg2 second argument. Could be an expression or constant (string, int, etc...)
   * @return equality comparison expression definition.
   */
  public static function greaterThanOrEqual(arg1 : Object, arg2 : Object) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "greaterOrEqual", {asExpression(arg1), asExpression(arg2)})
  }


  /** Creates logical "and" operation requiring that all the arguments are true. Evaluation is lazy. */
  public static function all(args : ExpressionDTO[]) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "and", args)
  }

  /** Creates logical "or" operation requiring that all the arguments are true. Evaluation is lazy. */
  public static function any(args : ExpressionDTO[]) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "or", args)
  }


  /** Creates a negation of the boolean expression. */
  public static function isNot(expr : ExpressionDTO) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "not", {expr})
  }

  /** Creates a comparison that the given year is less than or equal to next year. */
  public static function lessOrEqualToNextYear(expr : ExpressionDTO) : ExpressionDTO {
    return new NativeCallExpressionDTO(":sys:ops:", "lessOrEqualToNextYear", {expr})
  }

  /** Creates logical "or" operation requiring that all the arguments are true. Evaluation is lazy. Synonym for
  * <code>any</code>. */
  public static function some(args : ExpressionDTO[]) : ExpressionDTO {
    return any(args)
  }

  /**
   * Creates a translation with the given display key and arguments.
   * @param displayKey translation key. This would be looked up as a display key and relust would be formatted
   * accordingly.
   * @param args positional arguments to the translation.
   * @returns "translation" expression.
   */
  public static function translate(displayKey : String, args : ExpressionDTO[]) : ExpressionDTO {
      var nsMatcher = Pattern.compile("edge(v[a-z0-9]*)?").matcher((typeof Expr).Namespace)
      var namespace : String
      if (nsMatcher.find()){
        namespace = nsMatcher.group()
        displayKey = displayKey.replaceAll("Edge.", namespace.capitalize()+".")
      }
      return new TranslateDTO("displaykey." + displayKey, args)
  }
}
