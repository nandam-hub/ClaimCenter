package edge.metadata.typeinfo.type.dto

uses edge.jsonmapper.JsonProperty


/**
 * Type reference to the DTO.
 */
class ClassTypeDTO extends TypeDTO {
  /** Type (class) name of the value type. */
  @JsonProperty
  private var _className : String as readonly ClassName

  construct(clsName : String) {
    super("class")
    this._className = clsName
  }
}
