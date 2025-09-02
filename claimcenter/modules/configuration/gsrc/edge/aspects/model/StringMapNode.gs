package edge.aspects.model

uses edge.aspects.ancestors.AncestorChain
uses java.util.Map
uses java.util.Collections
uses java.util.Set
uses edge.aspects.model.factory.INodeFactory
uses java.util.HashMap
uses java.util.Collection

/**
 * Node for the "string map" type of the node.
 */
final class StringMapNode<C, T> extends ModelNode<T>  {

  /** Child nodes of this map. */
  private var _children : Map<String, ModelNode<T>>

  public construct(ctx : C, anc : AncestorChain<ModelNode<T>>, v : Object, asp(v : ModelNode<T>) : T, eltFactory : INodeFactory<C, T>) {
    super(anc, v, asp)

    final var mp = v as Map<String, Object>

    if (mp == null) {
      this._children = Collections.emptyMap<String, ModelNode<T>>()
    } else {
      final var childMap = new HashMap<String, ModelNode<T>>()

      for (var e in mp.entrySet()) {
        childMap.put(e.Key, eltFactory.createNode(ctx, anc.forChild(this, e.Key), e.Value))
      }
      this._children = Collections.unmodifiableMap(childMap)
    }
  }


  /** Keys of all child nodes. */
  public property get Keys() : Set<String> {
    return _children.keySet()
  }

  /** Number of child elements in this node. */
  public property get Size() : int {
    return _children.size()
  }

  /** Set of entries in this node. */
  public property get Entries() : java.util.Set<Map.Entry<String, ModelNode<T>>> {
    return _children.entrySet()
  }

  /** This node represented as map from element names to element nodes. */
  public property get AsMap() : Map<String, ModelNode<T>> {
    return _children
  }

  /**
   * Returns children element with a specific name. Returns <code>null</code> if there is no such child element.
   */
  public function getChild(name: String): ModelNode<T> {
    return _children.get(name)
  }

  override function getChildrenInternal(): Collection<ModelNode<T>> {
    return _children.values()
  }
}
