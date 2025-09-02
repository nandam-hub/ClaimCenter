package edge.aspects.model

uses java.util.Collection
uses edge.aspects.ancestors.AncestorChainElement

/** Utilities used to work with models. */
final class ModelUtil {


  /** Return children of the <code>node</code>. */
  public static function getChildren<T>(node : ModelNode<T>) : Collection<ModelNode<T>> {
    return node.getChildrenInternal()
  }

  /** Performs an in-order fold on the elements. It is essentially equivalent to a left fold on the list of elements
   * in in-order order.
   */
  public static function preOrderFold<V, T>(init : V, root : ModelNode<T>, step(v : V, node : ModelNode<T>) : V) : V {
    var vv = step(init, root)
    for (var child in getChildren<T>(root)) {
       vv = preOrderFold<V, T>(vv, child, step)
    }
    return vv
  }

  /** Performs an in-order aggregation on the elements. It is similar to preOrderFold but all calls to the
  * <code>step</code> function receives the same <code>init</code> value as its first parameter.
   */
  public static function preOrderAggregate<V, T>(init : V, root : ModelNode<T>, step(v : V, node : ModelNode<T>)) : V {
    step(init, root)
    for (var child in getChildren<T>(root)) {
      preOrderAggregate<V, T>(init, child, step)
    }
    return init
  }

}
