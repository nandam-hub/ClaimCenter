package edge.aspects.model

uses edge.aspects.ancestors.AncestorChain

uses java.util.HashMap
uses java.util.Map
uses java.util.Set
uses edge.aspects.model.factory.INodeFactory
uses gw.util.Pair
uses gw.lang.reflect.IPropertyInfo
uses java.util.Collections
uses java.util.Collection

/**
 * Node for the "DTO" type of the node.
 */
final class DtoNode<C, T> extends ModelNode<T>  {

  /** Child nodes of this node. */
  private var _children : Map<String, ModelNode<T>>

  public construct(ctx : C, anc : AncestorChain<ModelNode<T>>, v : Object, asp(v : ModelNode<T>) : T, props : List<Pair<IPropertyInfo, INodeFactory<C, T>>>) {
    super(anc, v, asp)

    final var childMap = new HashMap<String, ModelNode<T>>()

    if (v != null) {
      for (prop in props) {
        final var descriptor = prop.First
        final var propName = descriptor.Name
        childMap.put(propName, prop.Second.createNode(ctx, anc.forChild(this, propName), descriptor.Accessor.getValue(v)))
      }
    }

    this._children = Collections.unmodifiableMap(childMap)
  }


  /** Keys of all child nodes. */
  public property get PropertyNames() : Set<String> {
    return _children.keySet()
  }

  /** Set of entries in this node. */
  public property get Entries() : java.util.Set<Map.Entry<String, ModelNode<T>>> {
    return _children.entrySet()
  }

  /** This node represented as map from element names to element nodes. */
  public property get AsPropertyMap() : Map<String, ModelNode<T>> {
    return _children
  }

  /**
   * Returns a property element with a specific name. Returns <code>null</code> if there is no such child element.
   */
  public function getProperty(name: String): ModelNode<T> {
    return _children.get(name)
  }

  override internal function getChildrenInternal(): Collection<ModelNode<T>> {
    return _children.values()
  }
}
