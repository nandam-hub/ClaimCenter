package edge.metadata.typeinfo.typelistinfo.dto

uses edge.jsonmapper.JsonProperty

/**
 * Definition of one typelist filter.
 */
class TypelistFilterMetadataDTO {

  /** Name of the filter (default one, could be treated as typefilter ID. */
  @JsonProperty
  private var _name : String as Name

  /** Codes included by this typelifler. */
  @JsonProperty
  private var _includedValues : String[] as IncludedCodes
}
