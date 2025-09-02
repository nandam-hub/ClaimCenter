package edge.aspects.validation.augment

uses edge.el.evaluation.ExpressionEvaluator

/**
 * Compiled (optimized) representation of the augment rule.
 * @param T type of the context associated with this rule.
 */
internal final class CompiledAugmentRule<T> {
  /** Augment condition. */
  private var _condition : ExpressionEvaluator as Condition

  /** List of nodes to apply augment to. */
  private var _node : String as Node

  /** Metadata associated with this augment. */
  private var _meta: T as Meta


  construct(c : ExpressionEvaluator, n : String, m : T) {
    this._condition = c
    this._node = n
    this._meta = m
  }
}
