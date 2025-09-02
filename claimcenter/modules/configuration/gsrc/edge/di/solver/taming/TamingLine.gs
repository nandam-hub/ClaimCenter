package edge.di.solver.taming
uses edge.di.Path
uses gw.lang.reflect.IType

/** Wildcard taming controller. */
internal final class TamingLine {
  
  private var _path : Path
  private var _target : IType
  private var _parent : TamingLine
  
  internal static final var EMPTY : TamingLine = new TamingLine(null, null, null)

  internal construct(pnt : TamingLine, p : Path, t : IType) {
    this._parent = pnt
    this._path = p
    this._target = t
  }
  
  function sub(p : Path, t : IType) : TamingLine {
    return new TamingLine(this, p, t)
  }
  
  
  function findLoopPoint() : Path {
    var p = _parent
    
    while (p != null) {
      if (this._target.equals(p._target)) {
        return p._path
      }
      p = p._parent
    }
    
    return null
  }
  
}
