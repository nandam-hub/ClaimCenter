package edge.di.solver
uses edge.util.either.Either

/** Solution for one node. */
final class NodeSolution {
  
  /** Resolved node data. */
  var _target : TypeMetadata as readonly Target
  
  /** List of original items. */
  var _origins : List<String> as readonly Origins
  
  /** Solutions for all node arguments. Order of arguments is
   * the same as in the node constructor.
   */
  var _args : List<Either<String, NodeSolution>> as readonly Args

  internal construct(tgt : TypeMetadata, ors : List<String>, ar : List<Either<String, NodeSolution>>) {
    this._target = tgt
    this._origins = ors
    this._args = ar
  }

  override function toString() : String {
    return _target.ConcreteType.QName + "(" + _args + ")"
  }
}
