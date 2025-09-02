package edge.el.compilation

uses gw.lang.reflect.IType
uses edge.el.evaluation.Evaluators
uses edge.el.typing.ExpressionTypeSystem

/** One overload for the operator. */
final class OperatorOverload {

  /** Parameter types for this operator. */
  internal var _types : IType[]

  /** Result type. */
  internal var _resType : IType

  /** Evaluator for the overload. */
  internal var _evaluator : block(args : Object[]) : Object


  internal construct(t : IType[], rt : IType, ev : (args : Object[]) : Object) {
    this._types = t
    this._resType = rt
    this._evaluator = ev
  }
}
