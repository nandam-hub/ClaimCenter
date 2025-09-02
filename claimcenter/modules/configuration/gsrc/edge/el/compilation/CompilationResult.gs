package edge.el.compilation

uses gw.lang.reflect.IType
uses edge.el.evaluation.ExpressionEvaluator
uses edge.el.typing.ExpressionType

/**
 * Result of the expression compilation.
 */
public final class CompilationResult {
  /** Expression value evaluator. */
  private var _evaluator : ExpressionEvaluator as readonly Evaluator

  /** Expected expression type based on the input values. Could be <code>null</code> meaning that expression is
   * "dynamic" and not known in advance.
   */
  private var _expectedType : ExpressionType as readonly ExpectedType

  construct(evt : ExpressionEvaluator, et : ExpressionType) {
    this._evaluator = evt
    this._expectedType = et
  }
}
