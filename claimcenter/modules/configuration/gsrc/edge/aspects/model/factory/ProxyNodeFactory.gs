package edge.aspects.model.factory

uses edge.aspects.ancestors.AncestorChain
uses edge.aspects.model.ModelNode

/** Proxying node factory. Could be "resolved" after creation so it is handy in cyclical graphs. */
internal final class ProxyNodeFactory<C, T> implements INodeFactory<C, T> {
  internal var _peer: INodeFactory<C, T>

  override function createNode(ctx : C, ancestors: AncestorChain<ModelNode<T>>, value: Object): ModelNode<T> {
    return _peer.createNode(ctx, ancestors, value)
  }
}
