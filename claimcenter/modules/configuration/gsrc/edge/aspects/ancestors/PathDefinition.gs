package edge.aspects.ancestors

uses java.lang.IllegalArgumentException



/** Definition of the path to the node. */
final class PathDefinition {

  /** String representation of the path. */
  private var _asString : String as readonly AsString

  private construct(_rpr : String) {
    this._asString = _rpr
  }

  /** Returns a child path of this relative path with "string" path component. */
  public function child(subPath : String) : PathDefinition {
    validatePathElement(subPath)
    return new PathDefinition(this.AsString + "." + subPath)
  }

  /** Returns a child path of this relative path with "int" path component. */
  public function child(elt: int) : PathDefinition {
    return new PathDefinition(this.AsString + "[" + elt + "]")
  }

  /** Creates a new relative path starting from the "string" property access. */
  public static function start(subPath : String) : PathDefinition {
    validatePathElement(subPath)
    return new PathDefinition(subPath)
  }


  /** Creates a new relative path starting from the indexed access. */
  public static function start(elt : int) : PathDefinition {
    return new PathDefinition("[" + elt + "]")
  }


  /** Validates a string component of the path. */
  private static function validatePathElement(subPath : String) {
    if (subPath == '') {
      throw new IllegalArgumentException("Element accessor could not be empty")
    }

    if (subPath.indexOf('.') >= 0) {
      throw new IllegalArgumentException("Element accessor could not contain dot but it have, path==" + subPath)
    }
  }

}
