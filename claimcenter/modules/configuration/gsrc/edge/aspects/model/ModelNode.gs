package edge.aspects.model

uses edge.aspects.ancestors.AncestorChainElement
uses edge.aspects.ancestors.AncestorChain
uses java.util.Collection
uses edge.aspects.model.factory.IAspectFactory

/** Single element in the model. It could be a simple value (leaf) or an intermediate node (container/dto) with the
 * child properties.
 * @param T type of the metadata (extension data) on the node.
 */
abstract class ModelNode<T> {

  /** Chain of parent nodes. */
  private var _ancestors : AncestorChain<ModelNode<T>>

  /** (Optional) parent node. Denotes a parent node of this one. Set to <code>null</code> for the root node. */
  private var _parent : ModelNode<T> as readonly Parent

  /** Value of the node. I.e. value of the value of the "source" object to be modelled. It is a primitive for the
   * backed primitive values. It is an <em>original</em> DTO/collection for complex type.
   */
  private var _value : Object as readonly Value

  /** Value of the aspect defined on the node. */
  internal var _meta : T as readonly Meta

  internal construct(anc : AncestorChain<ModelNode<T>>, v : Object, asp(v : ModelNode<T>) : T) {
    this._ancestors = anc
    this._parent = anc.Ancestors.Empty ? null : anc.Ancestors.last().Node
    this._value = v
    this._meta = asp(this)
  }

//  private static function callUsingGosuWorkaround<T1>(item : ModelNode<T1>, asp : IAspectFactory<T1>) : T1 {
//    return asp.createAspectFor(item)
//  }

  /** Ancestor nodes of this element starting from the outermost ancestor. */
  public final property get Ancestors() : List<AncestorChainElement<ModelNode<T>>> {
    return _ancestors.Ancestors
  }

  /** Returns child nodes. Returns an empty list if there are no children nodes. */
  internal abstract function getChildrenInternal() : Collection<ModelNode<T>>
}
