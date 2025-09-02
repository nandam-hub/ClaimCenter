package edge.aspects.validation.requiredness

uses edge.util.lazy.LazyUtil
uses edge.aspects.validation.VisibilityAndRequiredness

/** Factory for the requiredness status. */
public final class RequirednessFactory {

  /** Used visibility rules. */
  private var _rules : List<CompiledVisibilityRule>

  internal construct(r : List<CompiledVisibilityRule>) {
    this._rules = r
  }

  /**
   * Returns a requiredness for the given node.
   * @param args arguments to pass to the requiredness expression and requiredness message.
   * @return list of (local) validity aspects for the value's node.
   */
  public function getRequiredness(args : Object[]) : List<RequirednessAspect> {
    return _rules.map(
        \rule -> new RequirednessAspect(
            rule.Visibility.evaluate(args) as VisibilityAndRequiredness,
                LazyUtil.theadUnsafe( \-> rule.Message.evaluate(args) as String)
        ));
  }
}
