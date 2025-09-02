package edge.el.evaluation
uses gw.lang.reflect.IMethodCallHandler

/** Call block evaluator required by Carbon platform (you cannot capture symbols in block nested in anonymous nested class). */
internal final class MethodCallEvaluator implements ExpressionEvaluator {

  private var _callHandler : IMethodCallHandler
  private var _methodArgs: ExpressionEvaluator[]

  construct(callHandler : IMethodCallHandler, methodArgs : ExpressionEvaluator[]) {
    this._callHandler = callHandler
    this._methodArgs = methodArgs
  }


  override function evaluate(args : Object[]) : Object {
     return _callHandler.handleCall(null, _methodArgs.map( \ ma -> ma.evaluate(args)))
  }

}
