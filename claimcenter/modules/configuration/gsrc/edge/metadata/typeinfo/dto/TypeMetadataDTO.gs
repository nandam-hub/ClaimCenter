package edge.metadata.typeinfo.dto

uses edge.jsonmapper.JsonProperty
/**
 * Metadata related to a particular type.
 */
final class TypeMetadataDTO {
  /** Name of the type. */
  @JsonProperty
  private var _name : String as Name

  /**
   * Metadata for the type. Actual type depends on the type's metatype. I.e. this data could be of TypelistMetadata
   * for the typelist but DTOMetadata for the DTO.
   */
  @JsonProperty
  private var _metadata : TypedDTO as Metadata

  construct(n : String, m : TypedDTO) {
    this._name = n
    this._metadata = m
  }
}
