package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses java.util.ArrayList
uses edge.aspects.validation.dto.IAugment
uses edge.metadata.annotation.IMetaMultiFactory
uses java.util.Arrays
uses java.lang.IllegalArgumentException
uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.dto.RuleAugmentationRuleDTO

class Augment implements IMetaFactory {
  /** Properties to augment. */
  private var _props : String []

  /** Augmentation description. */
  private var _augments = new ArrayList<IAugment>()

  /** Condition required to apply an augment. */
  private var _when : ExpressionDTO as When

  construct(propNames : String[], w : ExpressionDTO, wt : IAnnotation[]) {
    this._props = propNames
    this._when = w
    With = wt
  }

  construct(propNames : String[], wt : IAnnotation[]) {
    this._props = propNames
    With = wt
  }


  construct(propNames : String[]) {
    this._props = propNames
  }

  /** Augmests with one annotation. */
  private function augmentWith(ann : IAnnotation) {
    if (ann typeis IMetaFactory) {
      _augments.add(ann.getState() as IAugment)
    } else if (ann typeis IMetaMultiFactory) {
      _augments.addAll(Arrays.asList(ann.getState().map( \ elt -> elt as IAugment)))
    } else {
       throw new IllegalArgumentException("Could not treat " + typeof(ann) + " as an augment")
    }
  }

  property set With(rules : IAnnotation[]) {
    rules.each(\rule -> augmentWith(rule))
  }

  override function getState(): Object {
    return new RuleAugmentationRuleDTO(_props, _augments.toTypedArray(), _when)
  }
}
