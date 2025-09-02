package edge.metadata.service

uses gw.lang.reflect.IType
uses gw.lang.reflect.IPropertyInfo
uses java.util.concurrent.ConcurrentHashMap
uses java.util.concurrent.locks.ReentrantLock
uses edge.PlatformSupport.Reflection
uses edge.jsonmapper.JsonProperty
uses java.util.IdentityHashMap
uses edge.jsonmapper.JsonReadOnlyProperty

/** Default implementation of the metadata service. */
final class DefaultMetadataService implements IMetadataService {

  /** Service instance. */
  public static final var SERVICE : IMetadataService = new DefaultMetadataService(DefaultMetadataGenerator.INSTANCE)


  /** Metadata analyzer and generator. */
  private var _metaGen : IMetadataGenerator

  /** Map from type to its metadata. */
  private var _typeToMeta = new ConcurrentHashMap<IType, IElementMetadata>()

  /** Map from properties to its metadata. */
  private var _propToMeta = new IdentityHashMap<IPropertyInfo, IElementMetadata>()

  /** Generation lock. */
  private var lock = new ReentrantLock()

  construct(metaGen : IMetadataGenerator) {
    this._metaGen = metaGen
  }


  override function getTypeMetadata(type: IType): IElementMetadata {
    final var guess = _typeToMeta.get(type)
    if (guess != null) {
      return guess
    }

    using (lock) {
      final var checkedGuess = _typeToMeta.get(type)
      if (checkedGuess != null) {
        return checkedGuess
      }

      final var newItem = _metaGen.getTypeMetadata(type)
      _typeToMeta.put(type, newItem)
      return newItem
    }
  }

  override function getPropertyMetadata(prop: IPropertyInfo): IElementMetadata {
    using (lock) {
      final var checkedGuess = _propToMeta.get(prop)
      if (checkedGuess != null) {
        return checkedGuess
      }

      final var newItem = _metaGen.getPropertyMetadata(prop)
      _propToMeta.put(prop, newItem)
      return newItem
    }
  }

  /**
   * Returns list of property descriptors exposed to the public.
   */
  override function getExposedProperties(dtoType : IType) : IPropertyInfo[] {
    return dtoType.TypeInfo.Properties
        .where(\prop -> prop.Public &&
            (Reflection.hasAnnotation(prop, JsonProperty) || Reflection.hasAnnotation(prop, JsonReadOnlyProperty)))
        .toTypedArray()
  }

}
