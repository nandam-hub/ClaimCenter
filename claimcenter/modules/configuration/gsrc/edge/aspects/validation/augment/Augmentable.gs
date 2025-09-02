package edge.aspects.validation.augment

uses edge.aspects.model.ModelNode
uses edge.aspects.ancestors.PathDefinition
uses java.util.Map
uses java.util.Collections
uses edge.util.MapUtil
uses java.util.ArrayList
uses java.util.HashMap
uses gw.util.Pair

/**
 * Representation of the "augmentable" data. It contains data for the node itself and lists of "augments" for child
 * nodes.
 */
final class Augmentable<T> {


  /** Value for the node itself. */
  private var immediate : T

  /** Immediate value for this node. */
  private var immediateAsList : List<T>

  /** Augmentations for child nodes. */
  private var augmentMap : Map<String, List<T>>

  internal construct(imm : T, augMap : Map<String, List<T>>) {
    this.immediate = imm
    this.immediateAsList = Collections.singletonList(imm)
    this.augmentMap = augMap
  }

  /** Returns list of augment values for the given path. <code>null</code> value for path denotes "current" node
  * (i.e. it returns "original" value of the aspect, not augment for another child). */
  private function forPath(path : PathDefinition) : List<T> {
    if (path == null) {
      return immediateAsList
    }
    return MapUtil.getOrDefault(augmentMap, path.AsString, Collections.emptyList<T>())
  }


  /**
   * Returns a new augmentable with mapper applied to all the values.
   */
  public reified function map<V>(fn(t : T) : V) : Augmentable<V> {
    final var newAugments = augmentMap.mapValues(
        \ valueList -> valueList.map(fn))
    return new Augmentable<V>(fn(immediate), newAugments)
  }

  /**
   * Returns a new augmentable with mapper applied to all the rules. Null passed to identify rules applied directly
   * to the node (instead on some node on the parent).
   */
  public reified function mapWithPath<V>(fn(path : String, vl : T) : V) : Augmentable<V> {
    final var res = new HashMap<String, List<V>>()
    for (var entry in  augmentMap.entrySet()) {
      res.put(entry.Key, entry.Value.map(\value -> fn(entry.Key, value)))
    }
    return new Augmentable<V>(fn(null, immediate), res)
  }




  /**
   * Collects all the applicable rules starting from the <code>node</code>. Returned list always have a data defined
   * on the node. It could also include data defined by parent nodes. Note that extractor is not called on the node,
   * it is called on its parents only as the <code>node</code> could be under construction.
   * @param immediate immediate value (value of the aspect for the node).
   * @param node node defining extra augments.
   * @param extractor function used to extract data from the model node.
   */
  public static function collectWithParents<V, X>(immediate : Augmentable<X>, node : ModelNode<V>, extractor(v : V) : Augmentable<X>) : List<X> {
    final var res = new ArrayList<X>()

    for (var ancestor in node.Ancestors) {
      res.addAll(extractor(ancestor.Node.Meta).forPath(ancestor.PathToCurrent))
    }

    res.addAll(immediate.forPath(null))
    return res
  }


  /**
   * Collects all the applicable rules starting from the <code>node</code>. Returned list always have a data defined
   * on the node. It could also include data defined by parent nodes. Note that extractor is not called on the node,
   * it is called on its parents only as the <code>node</code> could be under construction.
   * @param immediate immediate value (value of the aspect for the node).
   * @param node node defining extra augments.
   * @param extractor function used to extract data from the model node.
   */
  public static function collectWithNode<V, X>(immediate : Augmentable<X>, node : ModelNode<V>, extractor(v : V) : Augmentable<X>) : List<Pair<ModelNode<V>, X>> {
    final var res = new ArrayList<Pair<ModelNode<V>, X>>()

    for (var ancestor in node.Ancestors) {
      res.addAll(extractor(ancestor.Node.Meta)
          .forPath(ancestor.PathToCurrent)
          .map(\elt -> Pair.make(ancestor.Node, elt)))
    }

    res.addAll(immediate.forPath(null).map(\elt -> Pair.make(node, elt)))
    return res
  }


  /**
   * Flattening version of the collectWithParents. It could be useful for rule-based systems where many rules could
   * be applied to the same node.
   * @param node node to collect data from.
   * @param extractor function used to extract data from the model node.
   */
  public static reified function collectWithParentsFlat<V, X>(immediate : Augmentable<List<X>>, node : ModelNode<V>, extractor(v : V) : Augmentable<List<X>>) : List<X> {
    return collectWithParents(immediate, node, extractor).flatten().toList()
  }


  /** Creates a new augmentable with the single value for the item. */
  public static reified function createEmpty<X>(value : X) : Augmentable<X> {
    return new Augmentable<X>(value, Collections.emptyMap())
  }
}
