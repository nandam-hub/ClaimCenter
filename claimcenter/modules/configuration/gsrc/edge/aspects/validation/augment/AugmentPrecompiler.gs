package edge.aspects.validation.augment

uses gw.lang.reflect.IType
uses edge.metadata.service.IElementMetadata
uses edge.metadata.service.ElementMetadataUtil
uses edge.aspects.validation.dto.RuleAugmentationRuleDTO
uses edge.el.Expr
uses edge.el.compilation.ExpressionCompiler
uses java.util.Arrays

/**
 * Precompiler for the augment(able) nodes.
 */
final class AugmentPrecompiler {
  /**
   * Creates a new augment factory based on the metadata.
   * That factory captures "metadata" in the factory and could pass that data to a callback based on runtime/environment
   * values.
   * @param meta node metadata.
   * @param expressionParamTypes types of the arguments to the augment condition expression. Values of these types
   *   should be passed to the returned factory to create an actual augment value.
   */
  public static reified function fromMetadata<X>(meta : IElementMetadata, expressionParamTypes : IType[], precompiler(path : String, m : IElementMetadata) : X) : AugmentFactory<X> {
    final var localInfo = precompiler(null, meta)
    final var augmentRules = meta.getMetadata<RuleAugmentationRuleDTO>()
    final var compiledRules = augmentRules.flatMap( \ elt -> compileRule<X>(elt, expressionParamTypes, precompiler))

    return new AugmentFactory<X>(localInfo, compiledRules)
  }


  /**
   * Compiles a single augment rule into its representation. That representation would be used by the augment factory
   * to create an actual augment object.
   */
  private static reified function compileRule<X>(rule: RuleAugmentationRuleDTO, expressionParamTypes : IType[], precompiler(path : String, m : IElementMetadata) : X) : List<CompiledAugmentRule<X>> {
    final var condExpession = rule.When == null ? Expr.const(true) : rule.When
    final var condition = ExpressionCompiler.compileExpecting(condExpession, boolean, expressionParamTypes)
    final var augmentDefinitions = rule.Augments.map( \ elt -> elt.Value)
    final var augmentedMeta = ElementMetadataUtil.fromObjects(augmentDefinitions)

    return Arrays.asList(rule.Targets.map( \ target ->
        new CompiledAugmentRule<X>(condition, target, precompiler(target, augmentedMeta))))
  }


}
