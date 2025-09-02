package edge.aspects.ancestors

/** One part of the ancestor chain element. */
final class AncestorChainElement<T> {
  /** Node in the ancestors chain. */
  private var _node : T as readonly Node

  /** Path from the ancestor to the current element. */
  private var _pathToCurrent : PathDefinition as PathToCurrent

  internal construct(n : T, ptc : PathDefinition) {
    this._node = n
    this._pathToCurrent = ptc
  }

  /** Returns this element as an ancestor of the child of the "current" element. */
  internal function forChild(idx : int) : AncestorChainElement<T> {
    return new AncestorChainElement<T>(_node, _pathToCurrent.child(idx))
  }

  /** Returns this element as an ancestor of the child of the "current" element. */
  internal function forChild(elt : String) : AncestorChainElement<T> {
    return new AncestorChainElement<T>(_node, _pathToCurrent.child(elt))
  }

  /** Creates a new direct ancestor. */
  internal static reified function make<T1>(n : T1, idx : int) : AncestorChainElement<T1> {
    return new AncestorChainElement<T1>(n, PathDefinition.start(idx))
  }

  /** Creates a new direct ancestor. */
  internal static reified function make<T1>(n : T1, elt : String) : AncestorChainElement<T1> {
    return new AncestorChainElement<T1>(n, PathDefinition.start(elt))
  }
}
