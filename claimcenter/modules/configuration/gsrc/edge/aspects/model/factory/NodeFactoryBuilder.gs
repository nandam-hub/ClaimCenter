package edge.aspects.model.factory

uses gw.lang.reflect.IType
uses java.util.Set
uses java.util.HashMap
uses edge.PlatformSupport.Reflection
uses java.lang.IllegalArgumentException
uses edge.metadata.service.IMetadataService
uses gw.util.Pair
uses gw.lang.reflect.IPropertyInfo
uses java.util.Arrays
uses java.util.IdentityHashMap

/** Builder of the node factories.
 * @param T type of the metadata built.
 */
internal final class NodeFactoryBuilder<C, T> {
  /** Collection types supported by this DTO analyzer. */
  private static final var COLLECTION_TYPES : Set<String> = {
      "java.util.LinkedList",
      "java.util.ArrayList",
      "java.util.List",
      "java.util.Set",
      "java.util.HashSet",
      "java.util.TreeSet"
  }


  /** Map types supported by this DTO analyzer. */
  private static final var MAP_TYPES : Set<String> = {
      "java.util.Map",
      "java.util.HashMap",
      "java.util.TreeMap"
  }


  /** Semi-primitives, which are treated as real primitives by the portal. */
  private static final var SEMI_PRIMITIVES : Set<IType> = {
      java.lang.Byte,
      java.lang.Short,
      java.lang.Character,
      java.lang.Integer,
      java.lang.Long,
      java.lang.Float,
      java.lang.Double,
      java.lang.Boolean,
      java.lang.String,

      java.util.Date,
      java.math.BigDecimal,
      java.math.BigInteger
  }


  /** Map from type to node factory for collection elements. */
  private final var collElementFactories = new HashMap<IType, INodeFactory<C, T>>()

  /** Map from property to property node factory. */
  /* WARNING! We _MUST_ use identity map or any other way to drop default definition of IPropertyInfo's identity. That
   *   identity is a lie. Property infos are equal when their names are equal. But this identity is incorrect because
   *   they could not access properties of the object they do not belong to!
   */
  private final var propElementFactories = new IdentityHashMap<IPropertyInfo, INodeFactory<C, T>>()


  /** Aspect pre-build module. */
  private var _precomp : IAspectPrecompiler<C, T>

  /** Type metadata service. */
  private var _metaService : IMetadataService

  internal construct(pc : IAspectPrecompiler<C, T>, metaService : IMetadataService) {
    this._precomp = pc
    this._metaService = metaService
  }


  /** Creates a node factory for the specific base type of the node. */
  internal function createNodeFactory(type : IType, aspectFactory : IAspectFactory<C, T>) : INodeFactory<C, T> {
    if (type.Primitive || SEMI_PRIMITIVES.contains(type) || isTypelist(type)) {
      return NodeFactoryUtil.forAtomic(aspectFactory)
    }

    if (type.Array) {
      return NodeFactoryUtil.forArray(aspectFactory, getCollectionElementFactory(type.ComponentType))
    }

    if (isCollection(type)) {
      return NodeFactoryUtil.forArray(aspectFactory, getCollectionElementFactory(type.TypeParameters[0]))
    }

    if (isMap(type)) {
      return NodeFactoryUtil.forStringMap(aspectFactory, getCollectionElementFactory(type.TypeParameters[1]))
    }

    if (type.TypeParameters != null && type.TypeParameters.length > 0) {
      throw new IllegalArgumentException("Unsupported generic non-collection type " + type.Name)
    }

    final var propDefs = Arrays.asList(_metaService.getExposedProperties(type))
    final var propFactories = propDefs.map( \ elt -> Pair.make<IPropertyInfo, INodeFactory<C, T>>(elt, getPropertyElementFactory(elt)))
    return NodeFactoryUtil.forDto(aspectFactory, propFactories)
  }


  /** Returns a factory for the collection element type. */
  private function getCollectionElementFactory(type : IType) : INodeFactory<C, T> {
    final var cached = collElementFactories.get(type)
    if (cached != null) {
      return cached
    }

    /* Avoid infinite loops by using proxies for recursive calls. */
    final var tmpProxy = new ProxyNodeFactory<C, T>()
    collElementFactories.put(type, tmpProxy)

    final var realFactory = createNodeFactory(type, _precomp.forCollectionElement(type))
    collElementFactories.put(type, realFactory)
    tmpProxy._peer = realFactory

    return realFactory
  }

  /** Returns a factory for the DTO property step. */
  private function getPropertyElementFactory(prop : IPropertyInfo) : INodeFactory<C, T> {
    final var cached = propElementFactories.get(prop)
    if (cached != null) {
      return cached
    }

    /* Avoid infinite loops by using proxies for recursive calls. */
    final var tmpProxy = new ProxyNodeFactory<C, T>()
    propElementFactories.put(prop, tmpProxy)

    final var realFactory = createNodeFactory(Reflection.getPropertyType(prop), _precomp.forProperty(prop))
    propElementFactories.put(prop, realFactory)
    tmpProxy._peer = realFactory

    return realFactory
  }


  /** Checks if the type represents a typelist. */
  private static function isTypelist(t : IType) : boolean {
    return t.Namespace == "typekey"
  }


  /**
   * Checks if the type is proper collection type. Type is proper when it implements a collection interface and exact
   * type is one of specific implementation types.
   * @returns <code>true</code> iff type is a "proper" collection type. <code>false</code> iff type is not a collection
   * type.
   * @throws IllegalArgumentException if <code>type</code> is a collection type but not from the list of predifined
   * (supported) collection types.
   */
  public  static function isCollection(type : IType) : boolean {
    if (!(java.util.Collection.isAssignableFrom(type))) {
      return false
    }

    final var genericType = Reflection.getGenericType(type)
    if (genericType != null && COLLECTION_TYPES.contains(genericType.Name)) {
      return true
    }

    throw new IllegalArgumentException("Type " + type.Name +
        " implements collection interface but is not one of the supported collection types.")
  }

  /**
   * Checks if the type is proper mapping type. Type is proper when it implements a map interface with string keys and
   * at the same time it is one of the specific types.
   * @returns <code>true</code> iff type is a "proper" mapping type. <code>false</code> iff type is not a mappings
   * type.
   * @throws IllegalArgumentException if <code>type</code> is a mapping type but not from the list of predifined
   * (supported) mapping types.
   */
  public static function isMap(type : IType) : boolean {
    if (!(java.util.Map.isAssignableFrom(type))) {
      return false
    }

    final var genericType = Reflection.getGenericType(type)
    if (genericType == null || !MAP_TYPES.contains(genericType.Name)) {
      throw new IllegalArgumentException("Type " + type.Name +
          " implements map interface but is not one of the supported collection types.")
    }

    if (type.TypeParameters[0] != String) {
      throw new IllegalArgumentException("Type " + type.Name +
          " implements map interface and must have a string key.")
    }

    return true
  }

}
