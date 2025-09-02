package edge.metadata.typeinfo.typelistinfo.dto

uses edge.jsonmapper.JsonProperty
uses edge.metadata.typeinfo.util.dto.NamedMetadataDTO

/**
 * Metadata about one typelist.
 */
class TypelistMetadataDTO {
  /** All typecodes included in this typelist. */
  @JsonProperty
  private var _codes : TypeCodeMetadataDTO [] as Codes


  /** List of filters defined for this typelist metadata. */
  @JsonProperty
  private var _filters : TypelistFilterMetadataDTO [] as Filters


  /**
   * Metadata elements with the associated name. Created as a result of the "factory function" and
   * the name is just only byproduct. This is the only known way to extend typelists.
   */
  @JsonProperty
  private var _namedMetadata : NamedMetadataDTO[] as NamedMetadata
}
