package edge.aspects.validation.requiredness

uses edge.metadata.service.IElementMetadata
uses gw.lang.reflect.IType
uses edge.aspects.validation.dto.VisibilityAndRequirednessRuleDTO
uses edge.aspects.validation.VisibilityAndRequiredness
uses edge.el.compilation.ExpressionCompiler
uses java.util.Collections

/**
 * Requiredness aspect precompiler.
 */
final class RequirednessPrecompiler {


  /** Default factory. This factory creates an initial visibility rule. */
  private static final var DEFAULT_FACTORY = new RequirednessFactory(Collections.emptyList())


  /**
   * Compiles a metadata and node types into the factory for the requiredness aspect of the given node.
   * @param metadata to use.
   * @param paramTypes types of the expression arguments. Values of these types must be passed to the
   * RequirednessFactory's getRequiredness method.
   */
  public static function fromDTO(rules : List<VisibilityAndRequirednessRuleDTO>, paramTypes: IType[]) : RequirednessFactory {
    if (rules.Empty) {
      return DEFAULT_FACTORY
    }

    final var compiledRules = rules.map( \ elt -> compileRule(elt, paramTypes))
    return new RequirednessFactory(compiledRules)
  }


  /**
   * Compiles a metadata and node types into the factory for the requiredness aspect of the given node.
   * @param metadata to use.
   * @param paramTypes types of the expression arguments. Values of these types must be passed to the
   * RequirednessFactory's getRequiredness method.
   */
  public static function fromMetadata(meta: IElementMetadata, paramTypes: IType[]) : RequirednessFactory {
    return fromDTO(meta.getMetadata<VisibilityAndRequirednessRuleDTO>(), paramTypes)
  }


  /** Compiles a single visibility rule. */
  private static function compileRule(rule : VisibilityAndRequirednessRuleDTO, paramTypes : IType[]) : CompiledVisibilityRule {
    return new CompiledVisibilityRule(
      ExpressionCompiler.compileExpecting(rule.Expression, VisibilityAndRequiredness, paramTypes),
      ExpressionCompiler.compileExpecting(rule.Message, String, paramTypes)
    )
  }
}
