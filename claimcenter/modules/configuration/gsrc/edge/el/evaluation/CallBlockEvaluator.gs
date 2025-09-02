package edge.el.evaluation

/** Call block evaluator required by Carbon platform (you cannot capture symbols in block nested in anonymous nested class). */
internal final class CallBlockEvaluator implements ExpressionEvaluator {
  
  private var _fn(args: Object[]): Object
  private var _blockArgs: ExpressionEvaluator[]

  construct(fn(args: Object[]): Object, blockArgs: ExpressionEvaluator[]) {
    this._fn = fn
    this._blockArgs = blockArgs
  }


  override function evaluate(args : Object[]) : Object {
    return _fn(_blockArgs.map(\ba -> ba.evaluate(args)))
  }

}
