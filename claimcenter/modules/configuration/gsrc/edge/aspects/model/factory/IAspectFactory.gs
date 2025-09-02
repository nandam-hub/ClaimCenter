package edge.aspects.model.factory

uses edge.aspects.model.ModelNode

/**
 * Factory used to create an aspect value based on the node. This factories are called during a node construction
 * process.
 *
 * <h1>Node completeness guarantees</h1>
 * Each aspect factory is called during the graph construction, so some elements may be not initialized.
 * It is guaranteed that following fields are initialized (and could be accessed by the aspect factory):
 * <ul>
 *   <li><code>Value</code> property on all parent nodes and on the current node.
 *   <li><code>Aspects</code> for any parent node.
 * </ul>
 *
 * There is <strong>no guarantee</strong> that any other objects are defined. It mean than there are no child nodes
 * for the current node, no siblings nodes for this node or other nodes in the ancestor chain.
 *
 * @param T type of the aspect.
 */
interface IAspectFactory<C, T> {
  /** Creates an aspect for the specific node. Please, consult class gosudoc for properties available and not
   * available on the node.
   * @param ctx external context.
   * @param node model node to create an aspect for
   * @returns value of the aspect node
   */
  public function createAspectFor(ctx  : C, node : ModelNode<T>) : T
}
