package edge.el.compilation

uses edge.el.dto.ExpressionDTO
uses gw.lang.reflect.IType
uses java.util.Map
uses java.lang.IllegalArgumentException
uses edge.el.dto.ParameterExpressionDTO
uses edge.el.dto.NativeCallExpressionDTO
uses java.lang.Integer
uses java.math.BigDecimal
uses java.lang.Long
uses edge.el.dto.ConstantExpressionDTO
uses edge.el.dto.FieldAccessExpressionDTO
uses edge.el.evaluation.Evaluators
uses edge.el.typing.ExpressionTypeSystem
uses edge.el.interop.GosuInterop
uses gw.lang.reflect.IEnumType
uses edge.el.evaluation.ExpressionEvaluator
uses edge.el.dto.TranslateDTO
uses gw.entity.ITypeList
uses java.util.Date

/**
 * Compiler for the expression language. Creates an expression evaluator for the expression specification and given
 * (expected) parameter types.
 */
final class ExpressionCompiler {

  /**
   * Map from expression kind to a compiler function.
   */
  private static final var KIND_COMPILERS : Map<String, block(e : ExpressionDTO, argTypes : IType[]) : CompilationResult> = {
    "parameter" -> \e, args -> compileArg(e, args),
    "nativecall" -> \e, args -> compileCall(e, args),
    "const" -> \e, args -> compileConst(e),
    "getfield" ->\e, args -> compileProperty(e, args),
    "translate" -> \e, args -> compileTranslate(e, args)
  };


  /** Operator definitions. */
  private static final var OPERATOR_DEFS : Map<String, OperatorCompiler>  = {
    "eq" -> Operators.defineSimple("eq", {Object, Object}, Boolean, \args -> args[0] == args[1]),
    "neq" -> Operators.defineSimple("eq", {Object, Object}, Boolean, \args -> args[0] != args[1]),
    "not" -> Operators.defineSimple("not", {Boolean}, Boolean, \args -> !(args[0] as Boolean)),
    "less" -> Operators.defineOverloadedOp("less", {
        Operators.overload({Integer, Integer}, Boolean, \args -> {
          final var res = (args[0] as Integer) < (args[1] as Integer)
          return res
        }),
        Operators.overload({Long, Long}, Boolean, \args -> (args[0] as Long) < (args[1] as Long)),
        Operators.overload({BigDecimal, BigDecimal}, Boolean, \args -> (args[0] as BigDecimal) < (args[1] as BigDecimal)),
        Operators.overload({Date, Date}, Boolean, \args -> (args[0] as Date) < (args[1] as Date)),
        Operators.overload({String, String}, Boolean, \args -> (args[0] as String) < (args[1] as String))
    }),
    "greater" -> Operators.defineOverloadedOp("greater", {
        Operators.overload({Integer, Integer}, Boolean, \args -> {
          final var res = (args[0] as Integer) > (args[1] as Integer)
          return res
        }),
        Operators.overload({Long, Long}, Boolean, \args -> (args[0] as Long) > (args[1] as Long)),
        Operators.overload({BigDecimal, BigDecimal}, Boolean, \args -> (args[0] as BigDecimal) > (args[1] as BigDecimal)),
        Operators.overload({Date, Date}, Boolean, \args -> (args[0] as Date) > (args[1] as Date)),
        Operators.overload({String, String}, Boolean, \args -> (args[0] as String) > (args[1] as String))
    }),
      "lessOrEqual" -> Operators.defineOverloadedOp("lessOrEqual", {
          Operators.overload({Integer, Integer}, Boolean, \args -> {
            final var res = (args[0] as Integer) <= (args[1] as Integer)
            return res
          }),
          Operators.overload({Long, Long}, Boolean, \args -> (args[0] as Long) <= (args[1] as Long)),
          Operators.overload({BigDecimal, BigDecimal}, Boolean, \args -> (args[0] as BigDecimal) <= (args[1] as BigDecimal)),
          Operators.overload({Date, Date}, Boolean, \args -> (args[0] as Date) <= (args[1] as Date)),
          Operators.overload({String, String}, Boolean, \args -> (args[0] as String) <= (args[1] as String))
      }),
      "greaterOrEqual" -> Operators.defineOverloadedOp("greaterOrEqual", {
          Operators.overload({Integer, Integer}, Boolean, \args -> {
            final var res = (args[0] as Integer) >= (args[1] as Integer)
            return res
          }),
          Operators.overload({Long, Long}, Boolean, \args -> (args[0] as Long) >= (args[1] as Long)),
          Operators.overload({BigDecimal, BigDecimal}, Boolean, \args -> (args[0] as BigDecimal) >= (args[1] as BigDecimal)),
          Operators.overload({Date, Date}, Boolean, \args -> (args[0] as Date) >= (args[1] as Date)),
          Operators.overload({String, String}, Boolean, \args -> (args[0] as String) >= (args[1] as String))
      }),
      "lessOrEqualToNextYear" -> Operators.defineOverloadedOp("lessOrEqualToNextYear", {
          Operators.overload({Integer}, Boolean, \args -> (java.util.Date.Today.addYears(1).YearOfDate) >= (args[0] as Integer))
      }),
    "and" -> Operators.defineLazyReduce("and", Boolean, \pars, inps -> pars.allMatch( \ par -> par.evaluate(inps) as Boolean)),
    "or" -> Operators.defineLazyReduce("or", Boolean, \pars, inps -> pars.hasMatch( \ par -> par.evaluate(inps) as Boolean))
  }


  /**
   * Compiles an expression based on the expression and expected argument types. Tries to infer as much types as
   * possible along the way.
   */
  public static function compile(expr : ExpressionDTO, argTypes : IType[]) : CompilationResult {
    final var compiler = KIND_COMPILERS.get(expr.Kind);
    if (compiler == null) {
      throw new IllegalArgumentException("Unsupported expression kind " + expr.Kind)
    }
    return compiler(expr, argTypes)
  }


  /**
   * Compiles an expression based on the expression and expected argument types. Tries to infer as much types as
   * possible along the way. Checks return type of the expression.
   */
  public static function compileExpecting(expr : ExpressionDTO, resType : IType, argTypes : IType[]) : ExpressionEvaluator {
    final var compilationResult = compile(expr, argTypes)
    if (!ExpressionTypeSystem.isDynamic(compilationResult.ExpectedType) &&
        !GosuInterop.isCallAssignable(resType, compilationResult.ExpectedType.GosuType)) {
      throw new IllegalArgumentException("Expression result type " + compilationResult.ExpectedType.GosuType + " is not compatible with the required type " + resType)
    }
    return compilationResult.Evaluator
  }


  /** Compiles an argument expression. */
  private static function compileArg(iexpr : ExpressionDTO, argTypes : IType[]) : CompilationResult {
    final var expr = iexpr as ParameterExpressionDTO
    return new CompilationResult(Evaluators.getArg(expr.Index), ExpressionTypeSystem.argType(argTypes, expr.Index))
  }



  /** Compiles a call expression. */
  private static function compileCall(iexpr : ExpressionDTO, argTypes : IType[]) : CompilationResult {
    final var expr = iexpr as NativeCallExpressionDTO
    final var argResults = expr.Params.map( \ elt -> compile(elt, argTypes))
    if (expr.Container == ":sys:ops:") {
      return compileSysCallMethod(expr.Name, argResults)
    }
    return compileNativeCallMethod(expr.Container, expr.Name, argResults)
  }


  /** Compiles a constant. */
  private static function compileConst(iexpr : ExpressionDTO) : CompilationResult {
    final var expr = iexpr as ConstantExpressionDTO
    if (expr.Type.startsWith("enum ")) {
      final var exprType = ExpressionTypeSystem.constType(expr.Value, expr.Type)
      return new CompilationResult(Evaluators.constant((exprType.GosuType as IEnumType).getEnumValue(expr.Value as String)), exprType)
    } else if (expr.Type.startsWith("typekey ")) {
      final var exprType = ExpressionTypeSystem.constType(expr.Value, expr.Type)
      final var code = (exprType.GosuType as ITypeList).getTypeKey(expr.Value as String)
      if (code == null) {
        throw new IllegalArgumentException("Bad typecode " + expr.Value + " for the " + expr.Type)
      }
      return new CompilationResult(Evaluators.constant(code), exprType)
    }

    return new CompilationResult(Evaluators.constant(expr.Value), ExpressionTypeSystem.constType(expr.Value, expr.Type))
  }


  /** Compiles a translation call. */
  private static function compileTranslate(iexpr : ExpressionDTO, argTypes : IType[]) : CompilationResult {
    final var expr = iexpr as TranslateDTO
    final var translateArgs = expr.Arguments.map( \ elt -> compile(elt, argTypes))

    return new CompilationResult(
      Evaluators.translate(expr.DisplayKey, translateArgs.map( \ elt -> elt.Evaluator)),
      ExpressionTypeSystem.translateType(translateArgs.map( \ elt -> elt.ExpectedType))
    )
  }


  /** Compiles property access. */
  private static function compileProperty(iexpr : ExpressionDTO, argTypes : IType[]) : CompilationResult {
    final var expr = iexpr as FieldAccessExpressionDTO
    final var base = compile(expr.Base, argTypes)

    if (ExpressionTypeSystem.isDynamic(base.ExpectedType)) {
      return new CompilationResult(
          Evaluators.propertyAccessor(expr.PropertyName, base.Evaluator),
          ExpressionTypeSystem.propType(base.ExpectedType, expr.PropertyName))
    }

    final var accessor = GosuInterop.gosuPropertyAccessor(base.ExpectedType.GosuType, expr.PropertyName)
    return new CompilationResult(
        Evaluators.propertyAccessor(accessor, base.Evaluator),
        ExpressionTypeSystem.propType(base.ExpectedType, accessor))
  }


  /** Compiles a system operation. */
  private static function compileSysCallMethod(methodName : String, methodArgs : CompilationResult[]) : CompilationResult {
    final var compiler = OPERATOR_DEFS.get(methodName)
    if (compiler == null) {
      throw new IllegalArgumentException("Unknown system operator name " + methodName)
    }
    return compiler.compileOperator(methodArgs)
  }


  /**
   * Lookups a method to be called for the native method call.
   * @param site call site to use.
   * @param method method name to use.
   * @param methodArgTypes argument types for the method names.
   */
  private static function compileNativeCallMethod(site: String, methodName : String, methodArgs : CompilationResult[]) : CompilationResult {
    final var method = GosuInterop.getStaticMethod(site, methodName, methodArgs)

    final var methodArgTypes = methodArgs.map( \ elt -> elt.ExpectedType)
    final var paramEvaluators = methodArgs.map( \ elt -> elt.Evaluator)

    return new CompilationResult(
        Evaluators.callStatic(method, paramEvaluators),
        ExpressionTypeSystem.staticCallType(method, methodArgTypes))
  }
}
