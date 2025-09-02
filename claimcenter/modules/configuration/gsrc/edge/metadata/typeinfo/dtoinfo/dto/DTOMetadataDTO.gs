package edge.metadata.typeinfo.dtoinfo.dto

uses edge.jsonmapper.JsonProperty
uses edge.metadata.typeinfo.dto.TypedDTO
uses edge.metadata.typeinfo.util.dto.NamedMetadataDTO
uses java.util.Map

/**
 * Metadata describing one DTO.
 */
class DTOMetadataDTO {
  /** Properties defined on the DTO. This list includes only readable and writeable properties. */
  @JsonProperty
  private var _properties : Map<String, DTOPropertyMetadataDTO> as Properties

  /** Metadata defined on the type level (type-level annotations). */
  @JsonProperty
  private var _metadata : TypedDTO[] as Metadata

  /**
   * Metadata elements with the associated name. Usually created as a result of the "factory function" and
   * the name is just only byproduct. However, some implementations may decide to "reference" these elements from other
   * annotations.
   */
  @JsonProperty
  private var _namedMetadata : NamedMetadataDTO[] as NamedMetadata
}
