package edge.di.solver.taming
uses edge.di.Path
uses gw.lang.reflect.IType

/** Path tamer context. */
final class Tamer {
  
  private var _publicWildcards : TamingLine
  
  private var _privateWildcards : TamingLine
  
  public static final var EMPTY : Tamer = new Tamer(TamingLine.EMPTY, TamingLine.EMPTY)
  
  private construct(pub : TamingLine, pri : TamingLine) {
    this._publicWildcards = pub
    this._privateWildcards = pri
  }

  function findPublicLoopPoint() : Path {
    return _publicWildcards.findLoopPoint()
  }

  function findPrivateLoopPoint() : Path {
    return _privateWildcards.findLoopPoint()
  }
  
  function subPublicWildcard(path : Path, goal : IType, watchLimit : int) : Tamer {
    if (path.Length <= watchLimit) {
      return EMPTY
    }
    
    /* Do not care about private wildcards while public are in effect. */
    return new Tamer(new TamingLine(_publicWildcards, path, goal), TamingLine.EMPTY)
  }

  function subPrivateWildcard(path : Path, goal : IType, watchLimit : int) : Tamer {
    if (path.Length <= watchLimit) {
      return EMPTY
    }
    
    return new Tamer(_publicWildcards, new TamingLine(_privateWildcards, path, goal))
  }
  
  function dropPrivateWildcard() : Tamer {
    return new Tamer(_publicWildcards, TamingLine.EMPTY)
  }
}
