package edge.metadata.typeinfo.typelistinfo.dto

uses edge.jsonmapper.JsonProperty

/**
 * Information about one typecode in the typelist.
 */
class TypeCodeMetadataDTO {
  /** Code of this typecode. */
  @JsonProperty
  private var _code : String as Code

  /**
   * Typecode priority (defined on the backend). Could be used for client-side sorting.
   */
  @JsonProperty
  private var _priority : int as Priority

  /**
   * Categories defined for the typecode.
   */
  @JsonProperty
  private var _categories : TypeCodeCategoryMetadataDTO [] as Categories

  /**
   * Display key defined for the typecode.
   */
  @JsonProperty
  private var _displayKey : String as DisplayKey
}
