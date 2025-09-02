package edge.metadata.service

uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IType

/** Interface used to generate metadata. */
interface IMetadataGenerator {
  /** Returns metadata for the specific type. */
  public function getTypeMetadata(type : IType) : IElementMetadata

  /**
   * Returns metadata of the given property. Property parameter is sufficient as it defines both container type
   * and property signature (property name and type).
   */
  public function getPropertyMetadata(prop : IPropertyInfo) : IElementMetadata
}
