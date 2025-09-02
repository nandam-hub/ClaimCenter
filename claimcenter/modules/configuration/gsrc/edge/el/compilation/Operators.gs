package edge.el.compilation

uses gw.lang.reflect.IType
uses edge.el.evaluation.Evaluators
uses edge.el.typing.ExpressionTypeSystem
uses edge.el.evaluation.ExpressionEvaluator
uses edge.el.interop.GosuInterop

/** Operator definition utils. */
final class Operators {

  /** Defines a simple operator compiler. */
  public static function defineSimple(opName : String, paramTypes : IType[], ret : IType, evaluator:(args : Object[]) : Object) : OperatorCompiler {
    return new OperatorCompiler(){
      override function compileOperator(args: CompilationResult[]): CompilationResult {
        final var argValues = args.map(\a -> a.Evaluator)
        final var argTypes = args.map( \ elt -> elt.ExpectedType)
        return new CompilationResult(
            Evaluators.callBlock(evaluator, argValues),
            ExpressionTypeSystem.callType("operator " + opName, ExpressionTypeSystem.fromGosuType(ret), paramTypes, argTypes))
      }
    }
  }


  /** Defines a lazy reduce operator (like boolean conjunction and disjunction). */
  public static function defineLazyReduce(opName : String, domainType : IType, evaluator(lazyArgs: ExpressionEvaluator[], evalArgs : Object[]) : Object) : OperatorCompiler {
    return new OperatorCompiler() {
      override function compileOperator(args: CompilationResult[]): CompilationResult {
        final var argExprs = args.map( \ elt -> elt.Evaluator)
        final var argTypes = args.map( \ elt -> elt.ExpectedType)

        return new CompilationResult(
            Evaluators.createLazyFn(evaluator, argExprs),
            ExpressionTypeSystem.reduceType("operator " + opName, domainType, argTypes))
      }
    }
  }


  /** Defines an overloaded operator with the dynamic overload. */
  public  static function defineOverloadedOp(opName : String, overloads : OperatorOverload[]) : OperatorCompiler {
    return new OperatorCompiler() {
      override function compileOperator(args: CompilationResult[]): CompilationResult {
        final var argExprs = args.map( \ elt -> elt.Evaluator)
        final var argTypes = args.map( \ elt -> elt.ExpectedType)
        final var isDynamic = argTypes.hasMatch( \ at -> ExpressionTypeSystem.isDynamic(at))
        if (isDynamic) {
          return new CompilationResult(
              defineDynamicCall(opName, overloads, argExprs),
              ExpressionTypeSystem.DYNAMIC_TYPE)
        }

        final var overload = getOverload(opName, overloads, argTypes.map( \ elt -> elt.GosuType))
        return new CompilationResult(
            Evaluators.callBlock(overload._evaluator, argExprs),
            ExpressionTypeSystem.callType("operator " + opName, ExpressionTypeSystem.fromGosuType(overload._resType), overload._types, argTypes)
          )
      }
    }
  }


  /** Creates an overload for the operator. */
  public static function overload(args: IType[], ret : IType, exec : (args: Object[]) : Object) : OperatorOverload {
    return new OperatorOverload(args, ret, exec)
  }


  /** Defines a dynamic operator call. */
  private static function defineDynamicCall(opName : String, overloads : OperatorOverload[], peers : ExpressionEvaluator[]) : ExpressionEvaluator {
    return Evaluators.callBlock(\args -> {
      final var argValues = args
      final var realTypes = argValues.map( \ elt -> typeof(elt))
      /* COMPATIBILITY NOTE, Carbon: could not call getOverload(...)._evaluator(argValues) */
      final var overloadBlock = getOverload(opName, overloads, realTypes)._evaluator
      return overloadBlock(argValues)
    }, peers)
  }


  /**
   * Returns an overload based on the argument types.
   */
  private static function getOverload(opName : String, overloads: OperatorOverload[], types : IType[]) : OperatorOverload {
    return GosuInterop.findOverload(opName, overloads, \ovd -> ovd._types, types)
  }
}
