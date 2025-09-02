package edge.aspects.validation.validity

uses java.util.ArrayList
uses edge.metadata.service.IElementMetadata
uses gw.lang.reflect.IType
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.dto.ExpressionDTO
uses edge.el.compilation.ExpressionCompiler

/** Precompiler for validity rules.
 */
final class ValidityRulePrecompiler {

  /** Creates a new validity rule factory from the metadata.
   * @param meta element metadata.
   * @param exprArgTypes types of the expression arguments. Values of these types must be passed into the
   *   ValidityRuleFactory's getValidity method.
   */
  public static function fromMetadata(meta: IElementMetadata, exprArgTypes: IType[]) : ValidityRuleFactory {
    final var allRules = new ArrayList<CompiledValidityRule>()
    allRules.addAll(meta.getMetadata<ValidationRuleDTO>().map(\r -> compileGenericRule(r, exprArgTypes)))
    return new ValidityRuleFactory(allRules)
  }


  /** Compiles a generic validation rule. */
  private static function compileGenericRule(r : ValidationRuleDTO, exprArgTypes : IType[]) : CompiledValidityRule {
    return compileRule(r.Expression, r.Message, exprArgTypes)
  }


  /** Compiles a rule in a general format. */
  private static function compileRule(vnExpression : ExpressionDTO, msgExpression : ExpressionDTO, exprArgTypes : IType[]) : CompiledValidityRule {
    return new CompiledValidityRule(
      ExpressionCompiler.compileExpecting(vnExpression, boolean, exprArgTypes),
      ExpressionCompiler.compileExpecting(msgExpression, String, exprArgTypes)
    )
  }
}
