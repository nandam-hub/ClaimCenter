package edge.di.solver.goals
uses java.lang.String
uses java.lang.Object
uses edge.di.solver.goals.Goal
uses edge.di.Path

/** Goal of copying destination node. */
final class PathGoal extends Goal {

  
  /** Type goal target. */
  var _target : Path as readonly Target

  construct(tgt : Path) {
    this._target = tgt
  }
  
  
  override function hashCode() : int {
    return _target.hashCode()
  }
  
  override function equals(other : Object) : boolean {
    if (other == null) {
      return false
    }
    
    if (!(other typeis PathGoal)) {
      return false
    }
    
    final var o = other as PathGoal
    return _target.equals(o._target)
  }

  override function toString() : String {
    return "Copy default tree from " + _target
  }

}
