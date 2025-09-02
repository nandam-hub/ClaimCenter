package edge.aspects.model.factory

uses edge.aspects.ancestors.AncestorChain
uses edge.aspects.model.ModelNode

/** Factory used to create model values.
 *
 * @param T type of the node.
 */
interface INodeFactory<C, T> {

  /**
   * Creates a model node in the object graph.
   * @param ctx node creation context.
   * @param ancestors ancestors of the node. Only <code>Value</code> is defined on those nodes. Sibling nodes
   * (other branches of the object graph) may be inaccessible. It is not guaranteed that any aspects are defined
   * on parent nodes.
   * @param value value of the node (model of the node).
   */
  public function createNode(ctx : C, ancestors : AncestorChain<ModelNode<T>>, value : Object) : ModelNode<T>
}
