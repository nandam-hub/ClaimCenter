package edge.el.evaluation

/**
 * Generic interface to all expressions which could be evaluated.
 */
interface ExpressionEvaluator {

  /** Evaluates an expression based on its input arguments. */
  public function evaluate(args : Object[]) : Object
}
