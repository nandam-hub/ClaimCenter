package edge.aspects.validation.context

uses edge.el.evaluation.ExpressionEvaluator

/** Compiled definition of the context rule. */
internal final class CompiledContextRule {

  /** Context field name. */
  private var _name : String as Name

  /** Value expression. */
  private var _expression : ExpressionEvaluator as Expression

  construct(n : String, e : ExpressionEvaluator) {
    this._name = n
    this._expression = e
  }
}
