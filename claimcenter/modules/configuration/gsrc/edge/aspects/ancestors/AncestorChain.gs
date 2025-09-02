package edge.aspects.ancestors

uses java.util.ArrayList
uses java.util.Collections

/** Chain of the ancestors of the element. */
final class AncestorChain<T> {
  /** List of all ancestors of the current element starting from the outermost one. */
  private var _ancestors : List<AncestorChainElement<T>> as readonly Ancestors

  /** Creates a new ancestors chain. */
  internal construct(anc : List<AncestorChainElement<T>>) {
    this._ancestors = anc
  }


  /** Returns this element as an ancestor of the child of the "current" element. */
  public function forChild(eltValue : T, idx : int) : AncestorChain<T> {
    var res = new ArrayList<AncestorChainElement<T>>(_ancestors.size() + 1)
    for (var anc in _ancestors) {
      res.add(anc.forChild(idx))
    }
    res.add(AncestorChainElement.make(eltValue, idx))
    return new AncestorChain<T>(Collections.unmodifiableList(res))
  }


  /** Returns this element as an ancestor of the child of the "current" element. */
  public function forChild(eltValue : T, elt : String) : AncestorChain<T> {
    var res = new ArrayList<AncestorChainElement<T>>(_ancestors.size() + 1)
    for (var anc in _ancestors) {
      res.add(anc.forChild(elt))
    }
    res.add(AncestorChainElement.make(eltValue, elt))
    return new AncestorChain<T>(Collections.unmodifiableList(res))
  }


  /** Chain with no ancestors. */
  public static reified function emptyChain<T1>() : AncestorChain<T1> {
    return new AncestorChain<T1>(Collections.emptyList<AncestorChainElement<T1>>())
  }
}
