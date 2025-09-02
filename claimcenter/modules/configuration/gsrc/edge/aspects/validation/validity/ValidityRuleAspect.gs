package edge.aspects.validation.validity

/** Simple validity rule aspect. */
final class ValidityRuleAspect {
  /** Validity message for this node. */
  private var _message : String

  internal construct(msg : String) {
    this._message = msg
  }

  /** Validation message. This message is <code>null</code> when this rule considers node as valid. */
  public property get Message() : String {
    return _message
  }
}
