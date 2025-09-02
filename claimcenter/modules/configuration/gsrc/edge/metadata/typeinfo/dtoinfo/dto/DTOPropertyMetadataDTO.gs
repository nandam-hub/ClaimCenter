package edge.metadata.typeinfo.dtoinfo.dto

uses edge.jsonmapper.JsonProperty
uses edge.metadata.typeinfo.type.dto.TypeDTO
uses edge.metadata.typeinfo.dto.TypedDTO

/**
 * Metadata about one DTO property. Contains essential data (like name/type) and all the "exportable" annotations for
 * the DTO.
 */
class DTOPropertyMetadataDTO {
  /** Property name. */
  /* Non-Json Property. */
  private var _name : String as Name

  /** Type of the value for this DTO. */
  @JsonProperty
  private var _valueType : TypeDTO as ValueType

  /** Metadata defined on the property. */
  @JsonProperty
  private var _metadata : TypedDTO[] as Metadata

  /** Identify if the property is readonly.
  *
  * Note we use Boolean instead of boolean as the type so that metadata will not be bloated with false values,
  * (null values are not deserialized) so a value with either be true or null
  **/
  @JsonProperty
  private var _readOnly : Boolean as ReadOnly

    /**
     * Information about the masked value
     */
    @JsonProperty
    private var _maskInfo : MaskInfoDTO as MaskInfo
}
