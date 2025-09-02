package edge.di.solver

uses gw.lang.reflect.IType
uses edge.util.either.Either
uses edge.di.Path
uses edge.di.solver.taming.Tamer
uses gw.util.Pair
uses java.util.Collections
uses edge.di.solver.goals.TypeGoal
uses edge.di.solver.goals.Goal
uses edge.di.solver.goals.PathGoal
uses java.util.Map
uses java.util.HashMap
uses edge.di.CapabilityAndPath

/**
 * Solution finder.
 */
final class Solver {

  /** Analyzer of type information. */
  private var _typeAnalyzer(goal : IType) : TypeMetadata

  /** Rulebook used. */
  private var _rulebook : Rulebook

  construct(ta(goal : IType) : TypeMetadata, rb : Rulebook) {
    this._typeAnalyzer = ta
    this._rulebook = rb
  }

  /**
   * Resolves a data for the node with a given implementation target.
   * Never returns null and never returns null as a node solution.
   */
  function solve(p: CapabilityAndPath, goal : IType) : Either<String, NodeSolution> {
    return sovleDescending(p.Capability, p.Path, p.Path, goal, Tamer.EMPTY, Collections.emptyList<RuleDefn>())
  }


  /**
   * Descending solver for public nodes.
   */
  private function sovleDescending(
      cap : String,
      p : Path,
      privatePath : Path,
      goal : IType,
      tm : Tamer,
      paramRefRules : List<RuleDefn> ) : Either<String, NodeSolution> {

    final var fullPath = new CapabilityAndPath(cap, p)
    final var fullPrivatePath = new CapabilityAndPath(cap, privatePath)

    final var res = solveByRules({
        Pair.make({_rulebook.conffileRules(fullPath), _rulebook.pathAnnots(fullPath, goal)}.flatMap(\ x -> x), Tamer.EMPTY),
        Pair.make(paramRefRules, tm.dropPrivateWildcard()),
        Pair.make(_rulebook.conffileWildcardRules(fullPath, goal), Tamer.EMPTY),
        Pair.make(_rulebook.wildcardAnnots(goal, cap), tm.subPublicWildcard(p, goal, _rulebook.maxExplicitRulePath(goal))),
        Pair.make(_rulebook.privateConffileRules(fullPrivatePath), tm.dropPrivateWildcard()),
        Pair.make(_rulebook.privateConffileWildcardRules(fullPrivatePath, goal), tm.dropPrivateWildcard()),
        Pair.make(_rulebook.privateWildcardAnnots(goal, cap), tm.subPrivateWildcard(p, goal, _rulebook.maxExplicitRulePath(goal)))
    }, cap, p)

    if (res.isLeft) {
      return res.mapRight<NodeSolution>(\ x -> null)
    }
    final var definition = res.right
    final var pubLoop = definition.Second.findPublicLoopPoint()
    if (pubLoop != null) {
      return Either.left<String, NodeSolution>("Unbounded wildcard application loop found starting from " + cap + ":" + pubLoop)
    }

    final var privateLoop = definition.Second.findPrivateLoopPoint()
    if (privateLoop != null) {
      return Either.left<String, NodeSolution>(
          "Broken GW-internal config: Unbounded wildcard application loop found starting from gw node " + cap + ":" + privateLoop)
    }

    final var decisionAndCauses = definition.First
    final var decision = decisionAndCauses.First

    if (decision typeis PathGoal) {
      return solveAscending(cap, decision.Target).mmapRight(
          \ typegoal -> makeNode(cap, p, decision.Target, goal, typegoal, definition.Second, decisionAndCauses.Second))
    }

    return makeNode(cap, p, privatePath, goal, (decision as TypeGoal).Target, definition.Second, decisionAndCauses.Second)
  }



  /** Creates a decision node. 
   * @param cap capability name
   * @param p real path in the source
   * @param privatePath path in GW-specified tree (reference tree)
   * @param goal target type
   * @param solution actual type
   * @param tamer wildcard taming context
   * @param origins causes of the solutionnnn
   */
  private function makeNode(cap : String, p : Path, privatePath : Path, goal : IType, solution : IType, tamer : Tamer, origins : List<String>) : Either<String, NodeSolution> {
    if (solution.isGenericType() && goal.TypeParameters.Count == 1) {
      solution = solution.getParameterizedType(goal.TypeParameters)
    }
    if (!goal.isAssignableFrom(solution)) {
      return Either.left<String, NodeSolution>(
          "Type " + solution.QName + " is incompatible with required type " + goal.QName + " but was pulled by " + origins.join(",") + " for path " + cap + ":" + p)
    }

    final var meta = _typeAnalyzer(solution)
    if (meta == null) {
      return Either.left<String, NodeSolution>(
          "Broken solution type " + solution.QName + ", type is not eligible for injection but pulled by " + origins.join(",") + "  for path " + cap + ":" + p)
    }

    return Either.right<String, NodeSolution>(new NodeSolution(meta, origins, meta.TypeParamMetadata.map(
        \ arg -> sovleDescending(
            cap,
                p.sub(arg.Name),
                privatePath.sub(arg.Name),
                arg.ArgType,
                tamer,
                arg.RefRule)).toList()
    ))
  }



  /**
   * Ascending solver. Finds a class to use in the GW-used path. 
   */
  private function solveAscending(cap : String, path : Path) : Either<String, IType> {
    final var explicitGroup = RuleDefn.getEffectiveGoal(_rulebook.privateConffileRules(new CapabilityAndPath(cap, path)))

    return explicitGroup.mmapRight(\ result -> {
      if (result != null) {
        return Either.right<String, IType>((result.First as TypeGoal).Target)
      }

      if (path.Length == 1) {
        return Either.left<String, IType>("Cannot find any ascentor with explicitly specified implementation type for gw path " + cap + ":" + path)
      }

      return solveAscending(cap, path.Parent).mmapRight(
          \ x -> descendOneElement(x, cap, path))
    })
  }


  /**
   * Descends one element based on the type information. 
   */
  private function descendOneElement(type : IType, cap : String, path : Path) : Either<String, IType> {
    final var meta = _typeAnalyzer(type)
    if (meta == null) {
      return Either.left<String, IType>("Mailformed Guidewire type at the " + cap + ":" + path + " point")
    }

    final var param = meta.TypeParamMetadata.firstWhere(\ c -> c.Name.equals(path.Name))
    if (param == null) {
      return Either.left<String, IType>("Cannot descend into " + cap + ":" + path + " due to missing argument in parent")
    }

    final var explicitGroup = RuleDefn.getEffectiveGoal(_rulebook.privateWildcardAnnots(param.ArgType, cap))
    return explicitGroup.mmapRight(\ result -> {
      if (result == null) {
        return Either.left<String, IType>(
            "Cannot build guidewire node at " + cap + ":" +  path + " due to missing GW implementations")
      }

      return Either.right<String, IType>((result.First as TypeGoal).Target)
    })
  }



  /**
   * Applies different rules and finds something applicable. If a rule fail, returns that failure.
   * If group returns success, returns success. Otherwise proceed to a next rule. Returns error if no
   * applicable rules can be found.
   */
  private function solveByRules(rules : Pair<List<RuleDefn>, Tamer>[], cap : String, path : Path) : Either<String, Pair<Pair<Goal, List<String>>, Tamer>> {
    for (var priority in rules) {
      final var conclusion = RuleDefn.getEffectiveGoal(priority.First)

      if (conclusion.isLeft) {
        return conclusion.mapRight<Pair<Pair<Goal, List<String>>, Tamer>>(\ p -> null)
      }

      if (conclusion.right != null) {
        return conclusion.mapRight<Pair<Pair<Goal, List<String>>, Tamer>>(\p -> Pair.make(p, priority.Second))
      }
    }

    return Either.left<String, Pair<Pair<Goal, List<String>>, Tamer>>(
        "Cannot find any applicable rule to RuleDefn node for path " + cap + ":" + path)
  }

  /**
   * Solves a target map and returns solutions for each node along with list of global errors.
   */
  public static function solve(
      clientPathRules : List<Pair<CapabilityAndPath, RuleDefn>>,
      privatePathRules : List<Pair<CapabilityAndPath, RuleDefn>>,
      queries : Map<CapabilityAndPath, IType>)
      :  Map<CapabilityAndPath, Either<String, NodeSolution>> {

    final var so = createSolver(clientPathRules, privatePathRules)

    final var resMap = new HashMap<CapabilityAndPath, Either<String, NodeSolution>>()

    for (var entry in queries.entrySet()) {
      resMap.put(entry.Key, so.solve(entry.Key, entry.Value))
    }

    return resMap
  }


  public static function createSolver(
      clientPathRules : List<Pair<CapabilityAndPath, RuleDefn>>,
      privatePathRules : List<Pair<CapabilityAndPath, RuleDefn>>) : Solver {
    final var ta = new TypeAnalyzer()
    final var impls = ImplementationProvider.create(\t -> ta.getMetadata(t))
    final var rulebook = new Rulebook(
        \t -> impls.getCandidates(t),
            clientPathRules, privatePathRules)
    return new Solver(\t -> ta.getMetadata(t), rulebook)
  }
}
