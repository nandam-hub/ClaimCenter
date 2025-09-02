package edge.metadata.typeinfo

uses gw.lang.reflect.IType
uses java.lang.Iterable
uses edge.metadata.typeinfo.dto.TypeMetadataDTO
uses java.util.HashSet
uses java.util.ArrayDeque
uses java.util.ArrayList
uses gw.entity.ITypeList
uses gw.util.Pair
uses edge.metadata.typeinfo.dto.TypedDTO
uses java.util.Arrays
uses edge.metadata.typeinfo.type.TypeAnalyzer
uses edge.metadata.typeinfo.typelistinfo.ITypelistAnalyzer
uses edge.metadata.typeinfo.dtoinfo.IDtoTypeAnalyzer

/**
 * Generator of type-related metadata.
 */
internal  final class TypeMetadataGenerator {

  /** Items enqueued in this generator. */
  private final var _enqueued = new HashSet<IType>()

  /** Types to process. */
  private final var _queue = new ArrayDeque<IType>()

  /** Actively updating result. */
  private final var _result = new ArrayList<TypeMetadataDTO>()

  /** Analyzer for typelists. */
  private var _typelistAnalyzer : ITypelistAnalyzer

  /** Analyzer for dtos. */
  private var _dtoAnalyzer : IDtoTypeAnalyzer

  internal construct(ta: ITypelistAnalyzer, da : IDtoTypeAnalyzer) {
    this._typelistAnalyzer = ta
    this._dtoAnalyzer = da
  }


  /** Enqueues a type if it is not privitive and is not already enqueued or processed. */
  private function enqueue(t : IType) {
    if (t.Primitive) {
      return
    }

    if (_enqueued.add(t)) {
      _queue.add(t)
    }
  }



  /** Adds types from the type representation. It may include type itself or some elements of the type (like an
   * element type of the array.
   */
  private function addRequiredTypes(type : IType) {
    /* Use type analyzer to exctract actual types  to be encoded. */
    TypeAnalyzer.encodeType(type).Second.each( \ elt -> enqueue(elt))
  }


  /** Enqueues batch of the items. */
  private function batchEnqueue(items : Iterable<IType>) {
    /* Carbon have do not have .forEach extension method on the Iterable. That method is defined either at the
     * Collection or List level. So we have to iterate through the list using explicit for instead of foreach.
     */
    for (var item in items) {
      addRequiredTypes(item)
    }
  }



  /** Processes its internal queue. */
  private function process() {
    while (!_queue.Empty) {
      final var t = _queue.remove()
      final var meta = getTypeMeta(t)
      _result.add(new TypeMetadataDTO(t.Name, TypedDTO.create(meta.First)))
      batchEnqueue(Arrays.asList(meta.Second))
    }
  }



  /** Returns metadata description for one object type. */
  private function getTypeMeta(t : IType) :  Pair<Object, IType[]> {
    if (isTypelist(t)) {
      return _typelistAnalyzer.describeTypelist(t as ITypeList)
    }
    return _dtoAnalyzer.encodeDTO(t)
  }



  /** Checks if the type represents a typelist. */
  private static function isTypelist(t : IType) : boolean {
    return t.Namespace == "typekey"
  }



  /**
   * Returns a metadata for types reacheable from the roots. It does not stop on the type itself but goes inside each
   * particular one. For example, if Claim is in the root types and it have a driver field of type Driver then
   * information about Driver class would be provided in the resulting array.
   *
   * <p>Current implementation works with the following types of objects:<ul>
   *   <li>Primitive types (are ignored).
   *   <li>Typelists are encoded with the typelist information.
   *   <li>All other objects treated as DTOs.
   * </ul>
   * @param roots initial types to get the information for.
   * @return metadata for types and types reacheable from the <code>roots</code>.
   * @throws IllegalArgumentException if any of the roots is not of a valid type or not a well-structured type itself.
   * For example, DTOs could not have arbitrary collections as its fileds, only fixed subset of collection types is
   * supported.
   */
  internal function getMetadata(roots : Iterable<IType>) : TypeMetadataDTO[] {
    batchEnqueue(roots)
    process()
    return _result.toTypedArray()
  }
}
