package edge.di.boot
uses edge.di.solver.Solver
uses edge.util.memo.Memo1
uses edge.di.CapabilityAndPath
uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.util.either.Either
uses edge.di.solver.NodeSolution
uses java.util.Collections
uses java.util.ArrayList
uses java.lang.Throwable
uses gw.api.util.Logger
uses java.util.concurrent.atomic.AtomicInteger
uses java.text.DecimalFormat

/** 
 * Node factory for configuration nodes.
 */
final class NodeBuilder {
  
  private static final var LOGGER = Logger.forCategory(NodeBuilder.Type.QName)
  
  /** Exception ID generator. */
  private static final var EXN_ID_GENERATOR = new AtomicInteger()

  
  private var _solver : Solver
  
  private var solutions = Memo1.makeMemo<Pair<CapabilityAndPath, IType>, Either<List<String>, Object>>(
    \ t -> solveRequest(t))
  
  /**
   * Path-based target solver.
   */
  construct(solver : Solver) {
    this._solver = solver
  }
  
  /** Tries to create implementation for the specific path. */
  function findNode(path : CapabilityAndPath, goal : IType) : Either<List<String>, Object> {
    return solutions.apply(Pair.make(path, goal))
  }
  
  
  private function solveRequest(req :  Pair<CapabilityAndPath, IType>) : Either<List<String>,Object> {
    final var solution = _solver.solve(req.First, req.Second)
    return make(req.First, solution)
  }
  
  
  /** Tries to create a node using a given "solution". Path is used for debugging purposes only. */
  private function make(path : CapabilityAndPath, item : Either<String, NodeSolution>) : Either<List<String>, Object> {
    if (item.isLeft) {
      return Either.left<List<String>, Object>(
        Collections.singletonList("Bad node spec at " + path + ":" + item.left))
    }
    
    final var spec = item.right
    
    final var allErrs = new ArrayList<String>()
    final var args = new ArrayList<Object>()
    
    var argIdx = 0
    while (argIdx < spec.Target.TypeParamMetadata.length) {
      final var argSolution = spec.Args.get(argIdx)
      final var argObject = make(path.sub(spec.Target.TypeParamMetadata[argIdx].Name), argSolution)
      if (argObject.isLeft) {
        allErrs.addAll(argObject.left)
      } else {
        args.add(argObject.right)
      }
      argIdx++
    }
    
    if (allErrs.size() > 0) {
      return Either.left<List<String>, Object>(allErrs)
    }

    try {
      return Either.right<List<String>, Object>(spec.Target.Constructor.newInstance(args.toTypedArray()))
    } catch(e : Throwable) {
      /* 
       * Provide full stack trace in one place and provide a reference to it. One exception could be a failure
       * cause for many other nodes. We do not want to pollute messages with full traces but at the same time 
       * we want to save the full exception log somewhere for a reference.
       */
      final var exnId = "DI_EXN_" + new DecimalFormat("000000000").format(EXN_ID_GENERATOR.incrementAndGet())
      LOGGER.error("Node configuration exception: " + exnId, e)
      return Either.left<List<String>, Object>(
        Collections.singletonList("Cannot create node at " + path + ": unexpected exception id=" + exnId))
    }
  }
}
