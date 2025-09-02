package edge.metadata.typeinfo.type.dto

uses edge.jsonmapper.JsonProperty

/**
 * Definition of the primitive type.
 * This could be a little bit wider than java primitive type and could include other "primitively-treated" types (
 * BigDecimals, Strings, etc...).
 */
class PrimitiveTypeDTO extends TypeDTO {

  /** Name (identifier) of the primitive type. */
  @JsonProperty
  private var _name : String as readonly Name

  construct(n : String) {
    super("primitive")
    this._name = n
  }
}
