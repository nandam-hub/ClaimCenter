package edge.aspects.validation.requiredness

uses edge.aspects.validation.VisibilityAndRequiredness
uses edge.util.lazy.LazyValue

/** Aspect defining requiredness of the node. */
final class RequirednessAspect {

  /** Requiredness status. */
  private var _status : VisibilityAndRequiredness

  /** Message used in a case of visibility status mismatch. This have to be lazy as we do not know expected visibility
   * and do not want to evaluate expression on some incorrect value.
   */
  private var _message : LazyValue<String>


  internal construct(s : VisibilityAndRequiredness, m : LazyValue<String>) {
    this._status = s
    this._message = m
  }


  /** Checks if this aspect requires node to be present. */
  public property get Requires() : boolean {
    return _status == VisibilityAndRequiredness.REQUIRED
  }


  /** Checks if this aspect requires node to be absent (have null/default value). */
  public property get Hides() : boolean {
    return _status == VisibilityAndRequiredness.NOT_SET
  }


  /** Return a message to show about failed validation (i.e. what was wrong with the status). */
  public property get StatusMismatchMessage() : String {
    return _message.Value
  }
}
