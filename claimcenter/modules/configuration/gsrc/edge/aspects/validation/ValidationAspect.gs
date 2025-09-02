package edge.aspects.validation

uses edge.aspects.validation.augment.Augmentable
uses edge.util.lazy.LazyValue
uses edge.aspects.validation.context.ContextAspect
uses edge.aspects.validation.requiredness.RequirednessFactory
uses edge.aspects.validation.validity.ValidityRuleFactory

/** Aspect defining validation-related information for the node. */
final class ValidationAspect {

  /** Requiredness for the node. */
  internal var _requiredness : Augmentable<RequirednessFactory>

  /** Validation rules defined in the node. */
  internal var _rules : Augmentable<ValidityRuleFactory>

  /** Validation messages for this node. */
  private var _nodeValidationMessages: List<String>

  /** Validity of the whole subtree starting from this node. */
  private var _subtreeValid : LazyValue<Boolean>


  /** Context defined on the node. */
  private var _context : ContextAspect


  internal construct(
        re : Augmentable<RequirednessFactory>,
        ru : Augmentable<ValidityRuleFactory>,
        mess: List<String>,
        sv : LazyValue<Boolean>,
        ct : ContextAspect) {
    this._requiredness = re
    this._rules = ru
    this._nodeValidationMessages = mess
    this._subtreeValid = sv
    this._context = ct
  }

  /** Node requiredness. */
  internal property get Requiredness() : Augmentable<RequirednessFactory> {
    return _requiredness
  }


  /** Rules defined at this node. */
  internal property get Rules() : Augmentable<ValidityRuleFactory> {
    return _rules
  }


  /** Rules defined at this node. */
  internal property get Context() : ContextAspect {
    return _context
  }

  /** Validation messages for the node. */
  public property get ValidationMessages() : List<String> {
    return _nodeValidationMessages
  }


  /** Node validity status. */
  public property get IsValid() : boolean {
    return ValidationMessages.Empty
  }
}
