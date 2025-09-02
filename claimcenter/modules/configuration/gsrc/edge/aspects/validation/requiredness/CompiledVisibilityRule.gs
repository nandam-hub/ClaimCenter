package edge.aspects.validation.requiredness

uses edge.el.evaluation.ExpressionEvaluator

/** Visibility rule compiled into the "evaluatable" form. */
internal final class CompiledVisibilityRule {
  /** Rule used to evaluate visibility. */
  private var _visibility : ExpressionEvaluator as Visibility

  /** Rule used to evaluate message. */
  private var _message : ExpressionEvaluator as Message

  construct(v : ExpressionEvaluator, m : ExpressionEvaluator) {
    this._visibility = v
    this._message = m
  }
}
