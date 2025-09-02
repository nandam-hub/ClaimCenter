package edge.el.dto

uses edge.jsonmapper.JsonProperty

/**
 * Expression having a constant value.
 */
class ConstantExpressionDTO extends ExpressionDTO {

  /** Constant type (string, number, date, etc...). */
  @JsonProperty
  private var _type : String as readonly Type

  /** Constant value. */
  @JsonProperty
  private var _value : Object as readonly Value

  construct(t : String, val : Object) {
    super("const")
    this._type = t
    this._value = val
  }
}
