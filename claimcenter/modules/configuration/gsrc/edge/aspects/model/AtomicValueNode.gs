package edge.aspects.model

uses edge.aspects.ancestors.AncestorChain
uses java.util.Collection
uses java.util.Collections

/** Simple (atomic) value with no underlying aspect structure. */
final class AtomicValueNode<T> extends ModelNode<T> {

  public construct(anc: AncestorChain<ModelNode<T>>, v: Object, asp(v : ModelNode<T>) : T) {
    super(anc, v, asp)
  }

  override internal function getChildrenInternal(): Collection<ModelNode<T>> {
    return Collections.emptyList<ModelNode<T>>()
  }
}
