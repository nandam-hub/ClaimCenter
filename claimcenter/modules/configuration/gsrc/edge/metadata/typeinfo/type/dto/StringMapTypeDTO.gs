package edge.metadata.typeinfo.type.dto

uses edge.jsonmapper.JsonProperty
/**
 * This type defines a map from the string key to the value.
 */
class StringMapTypeDTO extends TypeDTO {
  /** Type of values in this collection. */
  @JsonProperty
  private var _valueType : TypeDTO as ValueType

  construct(eltType : TypeDTO) {
    super("stringMap")
    this._valueType = eltType
  }
}
