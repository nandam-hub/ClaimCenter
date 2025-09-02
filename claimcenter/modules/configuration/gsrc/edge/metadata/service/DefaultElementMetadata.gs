package edge.metadata.service

uses gw.util.Pair
uses gw.lang.reflect.IType
uses java.util.Map
uses edge.util.MapUtil
uses java.util.Collections

/**
 * Default implementation of element metadata.
 */
final class DefaultElementMetadata implements IElementMetadata {

  /** "Empty" metadata with no metadata objects. */
  public static final var EMPTY_METADATA : IElementMetadata = create(Collections.emptyList(), Collections.emptyList())

  /** List of unnamed metadata. */
  private var _unnamedMetaList : List<Object>

  /** Named metadata items. */
  private var _namedMetaList : List<Pair<String, Object>>

  /** Map from type to unnamed metadata instance. */
  private var _typeToUnnamed : Map<IType, List<Object>>

  /** Map from name to named metadata map. */
  private var _nameToNamed : Map<String, Map<IType, List<Object>>>

  /** Map from type to all metadata. */
  private var _typeToAll : Map<IType, List<Object>>

  private construct(_uml : List<Object>, _nmd : List<Pair<String, Object>>) {
    this._unnamedMetaList = _uml
    this._namedMetaList = _nmd

    this._typeToUnnamed = MapUtil.groupCollection(_uml, \x -> typeof(x) as IType, \x -> x)
    final var byNames = MapUtil.groupCollection(_nmd, \x -> x.First, \x -> x.Second)
    this._nameToNamed = byNames.mapValues( \ forName ->
      MapUtil.groupCollection(forName, \x -> typeof(x) as IType, \x -> x))

    final var allMeta = _nmd.map( \ elt -> elt.Second).concat(_uml)
    this._typeToAll = MapUtil.groupCollection(allMeta, \x -> typeof(x) as IType, \x -> x)
  }


  override reified function getMetadata<T>(): List<T> {
    return MapUtil.getOrDefault(_typeToAll, T, Collections.emptyList()).map(\x -> x as T)
  }

  override reified function getNamedMetadata<T>(name: String): List<T> {
    final var forName = MapUtil.getOrDefault(_nameToNamed, name, Collections.emptyMap<IType, List<Object>>())
    return MapUtil.getOrDefault(forName, T, Collections.emptyList()).map(\x -> x as T)
  }

  override reified function getUnnamedMetadata<T>(): List<T> {
    return MapUtil.getOrDefault(_typeToUnnamed, T, Collections.emptyList()).map(\x -> x as T)
  }

  override function getAllUnnamedMetadata(): List<Object> {
    return _unnamedMetaList
  }

  override function getAllNamedMetadata(): List<Pair<String, Object>> {
    return _namedMetaList
  }


  /** Creates element metadata by list of named and unnamed metadata. */
  public static function create(unnamedMeta : List<Object>, namedMeta : List<Pair<String, Object>>) : IElementMetadata {
    return new DefaultElementMetadata(unnamedMeta, namedMeta)
  }
}
