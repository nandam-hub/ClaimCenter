package edge.di.solver

uses java.lang.String
uses edge.di.solver.goals.Goal
uses java.lang.Iterable
uses edge.util.either.Either
uses gw.util.Pair
uses edge.util.MapUtil

/**
 * Base for all rules. Each rule define detailed information about it's origin 
 * and target item (like path reference or type to use).  Concrete types define
 * additional properties like path to apply item to or property name.
 */
final class RuleDefn {
  /**
   * Description of rule origin (annotation, file, etc...).
   */
  var _origin : String as readonly Origin
  
  /**
   * Rule goal. Item to be used at the destination of the rule.
   */
  var _goal : Goal as readonly Goal

  construct(orig : String, g : Goal) {
    this._origin = orig
    this._goal = g
  }
  
  
  /**
   * Calculates an effective goal for the set of rules. Effective goal
   * is a single goal on which all the rules agrees. 
   * Returns left(error) if there is an error (for example, conflicting goals).
   * Returns right(null) if rule set is empty.
   * Returns right(rule, origins) with goals and their origins if there is an unique goal.
   */
  public static function getEffectiveGoal(effectiveRules : Iterable<RuleDefn>): Either<String, Pair<Goal, List<String>>> {
    final var targetMap = MapUtil.groupCollection<RuleDefn, Goal, String>(effectiveRules, \ rule -> rule.Goal, \ rule -> rule.Origin)

    if (targetMap.isEmpty()) {
      return Either.right<String, Pair<Goal, List<String>>>(null)
    }
    
    if (targetMap.size() == 1) {
      final var e = targetMap.entrySet().iterator().next()
      return Either.right<String, Pair<Goal, List<String>>>(Pair.make(e.Key, e.Value))
    }
    
    return Either.left<String, Pair<Goal, List<String>>>("Conflicting goals: \n" + 
      targetMap.entrySet()
        .map(\ entry ->"  " + entry.Key + " pulled by " + entry.Value.join(","))
        .join("\n"))
  }
}
