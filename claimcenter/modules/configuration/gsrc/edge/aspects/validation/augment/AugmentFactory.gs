package edge.aspects.validation.augment

uses java.util.HashMap
uses edge.util.MapUtil
uses java.util.ArrayList


/** Augmentation factory which could be used to define new augments.
 * @param T type of the augment value.
 */
public final class AugmentFactory<T> {
  /** Local (node) augment metadata. */
  private var _localMeta : T

  /** Augmentation rules defined for this factory. */
  private var _augments : List<CompiledAugmentRule<T>>


  internal construct(lm : T, ag : List<CompiledAugmentRule<T>>) {
    this._localMeta = lm
    this._augments = ag
  }


  /**
   * Creates a new "augmentable" data by evaluating augments applicable in the given conditions.
   * @param conditionArgs arguments used for the augments' "condition" expressions. Type of arguments and their
   * runtime values are defined by the augment's user.
   */
  public function createAugmentable(conditionArgs : Object[]): Augmentable<T> {
    final var appliedRules = _augments.where(
        \ aug -> aug.Condition.evaluate(conditionArgs) as Boolean)

    final var augs = new HashMap<String, List<T>>()
    for (var rule in appliedRules) {
      final var augmentValue = rule.Meta
      MapUtil.getOrUpdate(augs, rule.Node,\ -> new ArrayList<T>()).add(augmentValue)
    }

    return new Augmentable<T>(_localMeta, augs)
  }
}
