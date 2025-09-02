package edge.aspects.validation.context

uses java.util.Map

/** Implementation of the context aspect. */
final class ContextAspect {
  /** Parent context for this one. */
  private var _parent : ContextAspect

  /** Locally-defined values. */
  private var _localValues : Map<String, Object>


  internal construct(p : ContextAspect, vs : Map<String, Object>) {
    this._parent = p
    this._localValues = vs
  }


  /** Returns value associated with the specific key. Returns <code>null</code> if value is not found. */
  public function get(key : String) : Object {
    final var ownValue = _localValues.get(key)
    if (ownValue != null || _localValues.containsKey(key)) {
      return ownValue
    }

    if (_parent != null) {
      return _parent.get(key)
    }

    return null
  }
}
