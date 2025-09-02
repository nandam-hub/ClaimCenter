package edge.aspects.validation.validity

uses edge.el.evaluation.ExpressionEvaluator

/** Compiled representation of the validity rule. */
internal final class CompiledValidityRule {

  /** Validity expression. */
  private var _expr : ExpressionEvaluator as Validity

  /** Message expression. */
  private var _message : ExpressionEvaluator as Message

  construct(e : ExpressionEvaluator, m : ExpressionEvaluator) {
    this._expr = e
    this._message = m
  }
}
