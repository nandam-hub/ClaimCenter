package edge.di.solver.goals
uses java.lang.Object
uses java.lang.String
uses edge.di.solver.goals.Goal
uses gw.lang.reflect.IType

/** Goal for creating a specific type. */
final class TypeGoal extends Goal {
  
  /** Type goal target. */
  var _target : IType as readonly Target

  construct(tgt : IType) {
    this._target = tgt
  }
  
  
  override function hashCode() : int {
    return _target.hashCode()
  }
  
  override function equals(other : Object) : boolean {
    if (other == null) {
      return false
    }
    
    if (!(other typeis TypeGoal)) {
      return false
    }
    
    final var o = other as TypeGoal
    return _target.equals(o._target)
  }
  
  
  override function toString() : String {
    return "Create " + _target.QName
  }
}
