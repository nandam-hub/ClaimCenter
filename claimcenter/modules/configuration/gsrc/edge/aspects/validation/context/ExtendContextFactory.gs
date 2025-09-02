package edge.aspects.validation.context

uses java.util.HashMap

internal final class ExtendContextFactory extends ContextFactory{

  /** Rules for the given node. */
  private var rules : List<CompiledContextRule>

  construct(r: List<CompiledContextRule>) {
    this.rules = r
  }

  override function createContext(parentContext: ContextAspect, expressionArguments : Object[]): ContextAspect {
    final var overrideMap = new HashMap<String, Object>()
    for (var rule in rules) {
      overrideMap.put(rule.Name, rule.Expression.evaluate(expressionArguments))
    }

    return new ContextAspect(parentContext, overrideMap)
  }
}
