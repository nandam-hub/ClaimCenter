package edge.metadata.service

uses gw.lang.reflect.IType
uses gw.lang.reflect.IPropertyInfo

/**
 * Interface defining access to a metadata for different types. Instances of this service must be thread-safe.
 */
interface IMetadataService {
  /** Returns metadata for the specific type. */
  public function getTypeMetadata(type : IType) : IElementMetadata

  /**
   * Returns metadata of the given property. Property parameter is sufficient as it defines both container type
   * and property signature (property name and type).
   */
  public function getPropertyMetadata(prop : IPropertyInfo) : IElementMetadata


  /** Returns list of all exposed (publicly available) properties on the type. */
  public function getExposedProperties(dtoType : IType) : IPropertyInfo[]
}
