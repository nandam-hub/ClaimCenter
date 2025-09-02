package edge.metadata.service

uses gw.lang.reflect.IType
uses gw.lang.reflect.IPropertyInfo
uses edge.PlatformSupport.Reflection
uses edge.metadata.annotation.MetaFactory
uses edge.metadata.annotation.MetaMultiFactory
uses gw.util.Pair
uses java.util.Collections
uses edge.metadata.annotation.IMetaFactory
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.metadata.annotation.ITypeAwareMetaFactory
uses edge.metadata.annotation.ITypeAwareMetaMultiFactory
uses java.util.Arrays
uses edge.metadata.annotation.IPropertyAwareMetaFactory
uses edge.metadata.annotation.IPropertyAwareMetaMultiFactory

/** Default generator of metadata information. */
final class DefaultMetadataGenerator implements IMetadataGenerator {

  /** Instance of the default metadata generator. */
  public static final var INSTANCE : IMetadataGenerator = new DefaultMetadataGenerator()

  private construct() {

  }

  override function getTypeMetadata(type: IType): IElementMetadata {
    final var annotations = Reflection.getAnnotations(type)
    final var commonAnnotations = encodeAnnotations(annotations)
    final var typeAwareAnnotations =
        filterAnnotations<ITypeAwareMetaFactory>(annotations).map( \ elt -> elt.getState(type))
    final var typeAwareMultis =
        filterAnnotations<ITypeAwareMetaMultiFactory>(annotations).flatMap( \ elt -> Arrays.asList(elt.getState(type)))
    final var meta =
        {commonAnnotations, typeAwareAnnotations, typeAwareMultis}.flatten().toList()
    return DefaultElementMetadata.create(
        meta,
        encodeMetaFromTypeFactories(type))
  }


  override function getPropertyMetadata(prop: IPropertyInfo): IElementMetadata {
    final var annotations = Reflection.getAnnotations(prop)
    final var commonAnnotations = encodeAnnotations(annotations)
    final var propAwareAnnotations =
        filterAnnotations<IPropertyAwareMetaFactory>(annotations).map( \ elt -> elt.getState(prop))
    final var propAwareMultis =
        filterAnnotations<IPropertyAwareMetaMultiFactory>(annotations).flatMap( \ elt -> Arrays.asList(elt.getState(prop)))
    final var meta =
        {commonAnnotations, propAwareAnnotations, propAwareMultis}.flatten().toList()
    return DefaultElementMetadata.create(
        meta,
        Collections.emptyList())
  }


  /**
   * Extracts a named metadata items from the property. Returns an empty array if the property is not a "metadata
   * factory" property.
   */
  private static function encodeMetaFromFactory(prop : IPropertyInfo) : List<Pair<String, Object>> {
    if (!prop.Static || !prop.Public) {
      return {}
    }

    if (Reflection.hasAnnotation(prop, MetaFactory)) {
      return Collections.singletonList(Pair.make(prop.Name, prop.Accessor.getValue(null) ))
    }
    if (Reflection.hasAnnotation(prop, MetaMultiFactory)) {
      return (prop.Accessor.getValue(null) as Object[])
        .map(\v -> Pair.make(prop.Name, v))
        .toList()
     }

    return {}
  }


  /**
   * Extracts and encodes all the eligible named metadata from the type.
   * See "Metadata Factory Method" in the Developer guide for possible use of the features.
   */
  private static function encodeMetaFromTypeFactories(t : IType) : List<Pair<String, Object>> {
    return t.TypeInfo.Properties
        .flatMap( \ prop -> encodeMetaFromFactory(prop))
  }

  /**
   * Encodes all the annotation-based metadata into the typed DTOs. Skips non-metadata annotations.
   */
  private static function encodeAnnotations(annotations : List<IAnnotation>) : List<Object> {
    return annotations.flatMap(\ann -> encodeAnnotation(ann).toList())
  }


  /**
   * Encodes metadata defined by the annotation. Returns an empty array if annotation defines no metadata (i.e. it is
   * a non-metadata annotation which should not be passed to web clients).
   * @returns encoded (tagged) metadata provided by the annotation or an empty array.
   */
  public  static function encodeAnnotation(ann : IAnnotation) : Object[] {
    if (ann typeis IMetaFactory) {
      return { ann.getState() }
    }
    if (ann typeis IMetaMultiFactory) {
      return ann.getState()
    }
    return {}
  }


  /** Filters annotation based on the type. */
  private static reified function filterAnnotations<T>(annotations : List<IAnnotation>) : List<T> {
    return annotations.where( \ elt -> elt typeis T).map( \ elt -> elt as T)
  }
}
