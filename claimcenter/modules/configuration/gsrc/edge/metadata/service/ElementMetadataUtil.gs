package edge.metadata.service

uses gw.lang.reflect.IPropertyInfo
uses edge.PlatformSupport.Reflection

/** Utilities for the element metadata. */
final class ElementMetadataUtil {

  /** Composes metadata from multiple providers into one big metadada. */
  public static function compose(elements : IElementMetadata[]) : IElementMetadata {
    if (elements.length == 1)  {
      return elements[0]
    }

    return new CompositeElementMetadata(elements)
  }


  /** Creates a metadata from list of explicit objects (values). */
  public static function fromObjects(values : Object[]) : IElementMetadata {
    return new ExplicitMetadata(values)
  }

  /** Returns a "composite" metadata generated from both implicit property metadata and metadata on the property's
   * type.
   */
  public static function getJointMetadata(ms : IMetadataService, prop : IPropertyInfo) : IElementMetadata {
    return compose({ms.getPropertyMetadata(prop), ms.getTypeMetadata(Reflection.getPropertyType(prop))})
  }
}
