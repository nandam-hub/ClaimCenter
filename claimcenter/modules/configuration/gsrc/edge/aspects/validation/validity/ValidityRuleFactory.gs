package edge.aspects.validation.validity

/** Factory for the validity. */
public final class ValidityRuleFactory {

  /** Used visibility rules. */
  private var _rules : List<CompiledValidityRule>


  construct(r: List<CompiledValidityRule>) {
    this._rules = r
  }


  /** Creates a node validity information.
   * @param exprArguments list of arguments to pass to validation validity and message expressions.
   * @return list of (local) validity aspects for the value's node.
   */
  public function getValidity(exprArguments : Object[]) : List<ValidityRuleAspect> {
    final var failedRules = _rules.where( \ elt -> !(elt.Validity.evaluate(exprArguments) as Boolean))
    return failedRules.map(
        \ elt -> new ValidityRuleAspect(elt.Message.evaluate(exprArguments) as String))
  }
}
