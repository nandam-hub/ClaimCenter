package edge.aspects.validation.context

uses gw.lang.reflect.IType
uses edge.aspects.validation.dto.ContextDTO
uses edge.el.compilation.ExpressionCompiler
uses java.util.Map
uses edge.metadata.service.IElementMetadata
uses java.util.Collections

/** Precompiler for the context aspect.
 */
final class ContextPrecompiler {

  /** Empty context (context with no data in it). */
  private static final var EMPTY_CONTEXT = new ContextAspect(null, Collections.emptyMap())

  /** Factory which inherits parent context. */
  private static final var INHERIT_CONTEXT_FACTORY = new ContextFactory() {
    override function createContext(parentContext: ContextAspect, expressionArguments : Object[]): ContextAspect {
      return parentContext == null ?  EMPTY_CONTEXT : parentContext
    }
  }

  /**
   * Creates a new context factory based on the metadata. Similar to fromDtos but extracts DTOs from the metadata.
   */
  public static function fromMetadata(meta : IElementMetadata, exprParamTypes : IType[]) : ContextFactory {
    return fromDTO(meta.getMetadata<ContextDTO>(), exprParamTypes)
  }


  /**
   * Creates a new context factory based on the DTOs.
   * @param meta metadata defining context.
   * @param exprParamTypes types of the arguments to context expressions. Values of these types must be passed into
   *    createContext method of the returned object.
   */
  public static function fromDTO(meta: List<ContextDTO>, exprParamTypes: IType[]) : ContextFactory {
    if (meta.Empty) {
      return INHERIT_CONTEXT_FACTORY
    }

    return new ExtendContextFactory(meta.map( \ elt -> compileRule(elt, exprParamTypes)))
  }


  /**
   * Creates a static context which returns properties from the passed map.
   */
  public static function createStaticContext(objMap : Map<String, Object>) : ContextAspect {
    return new ContextAspect(null, objMap)
  }


  /** Compiles a rule into its internal representation. */
  private static function compileRule(rule : ContextDTO, exprParamTypes : IType[]) : CompiledContextRule {
    return new CompiledContextRule(rule.Name, ExpressionCompiler.compile(rule.Expression, exprParamTypes).Evaluator)
  }
}
