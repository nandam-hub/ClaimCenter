package edge.el.dto

uses edge.jsonmapper.JsonProperty

/**
 * DTO defining an access to the property on another object.
 */
class FieldAccessExpressionDTO extends ExpressionDTO {

  /** Base expression defining a property in question. */
  @JsonProperty
  private var _base : ExpressionDTO as readonly Base

  /** Property name to get. */
  @JsonProperty
  private var _property : String as readonly PropertyName

  construct(bs : ExpressionDTO, prop : String) {
    super("getfield")
    this._base = bs
    this._property = prop
  }
}
