package edge.el.evaluation

uses edge.PlatformSupport.TranslateUtil
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IMethodInfo
uses java.lang.IllegalArgumentException
uses edge.PlatformSupport.Reflection

/**
 * Factories for evaluators. Evaluators do not care about type safety and do not provide any typing mechanisms by itself.
 */
final class Evaluators {

  /** Length of the displaykey prefix. */
  private static final var DISPLAYKEY_PREFIX_LEN = "displaykey.".length()

  /** Returns an expression used to access an argument. */
  public static function getArg(argIdx : int) : ExpressionEvaluator {
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        return args[argIdx]
      }
    }
  }


  /** Creates a new "constant" expression. I.e. an evaluator which evaluates to a constant value. */
  public static function constant(value : Object) : ExpressionEvaluator {
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        return value
      }
    }
  }


  /** Creates a property access expression. This function is useful for properties known in advance. */
  public static function propertyAccessor(prop : IPropertyInfo, expr : ExpressionEvaluator) : ExpressionEvaluator {
    final var accessor = prop.Accessor
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        final var base = expr.evaluate(args)
        return base == null ? null : accessor.getValue(base)
      }
    }
  }


  /** Creates a property accessor. Returned evaluator perform dynamic property lookup and could handle objects of
  * different runtime types.
  */
  public static function propertyAccessor(propName : String, expr : ExpressionEvaluator) : ExpressionEvaluator {
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        final var base = expr.evaluate(args)
        return base == null ? null : base[propName]
      }
    }
  }



  /**
   * Creates an evaluator for the static call method.
   */
  public static function callStatic(method : IMethodInfo, methodArgs: ExpressionEvaluator[]) : ExpressionEvaluator {
    if (!method.Static) {
      throw new IllegalArgumentException("Could not call non-static method " + Reflection.getMethodName(method) + " using static rules")
    }
    return new MethodCallEvaluator(method.CallHandler, methodArgs)
  }


  /** Creates an evaluator which invokes a specified block to perform its function. */
  public static function callBlock(fn(args: Object[]): Object, blockArgs: ExpressionEvaluator[]) : ExpressionEvaluator {
    return new CallBlockEvaluator(fn, blockArgs)
  }

  /**
   * Creates a translation for the fixed display key and (dynamic) arguments.
   */
  public static function translate(displayKey : String, translateArgs : ExpressionEvaluator[]) : ExpressionEvaluator {
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        final var argValues = translateArgs.map( \ elt -> elt.evaluate(args))
        return TranslateUtil.translate(displayKey.substring(DISPLAYKEY_PREFIX_LEN), argValues)
      }
    }
  }


  /**
   * Creates an evaluator which could evaluate its arguments lazily. Unlike a common block it receives evaluators and
   * not values.
   */
  public static function createLazyFn(fn(blocks : ExpressionEvaluator[], args : Object[]) : Object, blockArgs: ExpressionEvaluator[]) : ExpressionEvaluator {
    return new ExpressionEvaluator() {
      override function evaluate(args: Object[]): Object {
        return fn(blockArgs, args)
      }
    }
  }
}
