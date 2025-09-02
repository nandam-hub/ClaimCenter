package edge.di.solver.goals
uses edge.di.solver.goals.PathGoal
uses edge.di.solver.goals.TypeGoal
uses edge.di.Path
uses gw.lang.reflect.IType

/** Rule goal. */
abstract class Goal {

  internal construct() {

  }

  public static function forPath(path : Path)  :PathGoal {
    return new PathGoal(path)
  }
  
  public static function forType(type : IType) : TypeGoal {
    return new TypeGoal(type)
  }
}
