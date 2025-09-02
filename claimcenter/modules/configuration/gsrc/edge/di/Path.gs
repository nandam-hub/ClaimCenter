package edge.di

uses java.lang.IllegalArgumentException
uses java.util.regex.Pattern

/** 
 * Path specification
 */
final class Path {

  static final var wildcardPath: Path as WILDCARD_PATH = new Path(null, "*")

  /** Parent path. */
  var _parent : Path as readonly Parent;
  
  /** Path name. */
  var _name : String as readonly Name;
  
  /** Cached hashcode. */
  private var _hash : int;
  
  /** Path depth. */
  var _length : int as readonly Length
  
  /** Cached path. */

  private construct(p : Path, n : String) {
    this._parent = p
    this._name = n
    
    this._hash = (p != null ? p.hashCode() * 31 : 0) + n.hashCode()
    this._length = p != null ? p.Length + 1 : 1
  }
  
  /** 
   * Creates a child path.
   */
  function sub(elt : String) : Path {
    checkPath(elt)
    return new Path(this, elt)
  }  
  
  override function toString() : String {
    if (_parent == null) {
      return _name
    }
    
    return _parent.toString() + "." + _name
  }
  
  override function hashCode() : int {
    return _hash;
  }
  
  override function equals(other : Object) : boolean {
    if (!(other typeis Path)) {
      return false
    }
   
    final var o = other as Path
    
    if (!o._name.equals(this._name)) {
      return false
    }
    
    if (this._parent == null) {
      if (o._parent != null) {
        return false
      }
    } else {
      if (!this._parent.equals(o._parent)) {
        return false
      }
    }
    
    return true
  }
  
  
  /** Creates a root path. */
  static function root(path : String) : Path {
    checkPath(path)
    return new Path(null, path)
  }
  
  
  /** Parses a path. */
  static function parse(path : String) : Path {
    checkPath(path)
    if (path.isEmpty()) {
      throw new IllegalArgumentException("Path cannot be empty")
    }

    final var parts = path.startsWith("deserializers") ? path.split(Pattern.quote("."),2) : path.split(Pattern.quote("."))
    var res = new Path(null, parts[0])
    var idx = 1
    while (idx < parts.length) {
      res = new Path(res, parts[idx])
      idx++
    }
    
    return res
  }
  
  /**
   * Ensures that string is valid path element.
   * @throws IllegalArgumentException if path is <code>null</code>.
   */
  private static function checkPath(path : String) {
    if (path == null) {
      throw new IllegalArgumentException("Path cannot be null")
    }
  }
}
