package edge.el.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.IllegalArgumentException

/**
 * Access to the parameter of the expression.
 */
class ParameterExpressionDTO extends ExpressionDTO {
  /** Index of the parameter. */
  @JsonProperty
  private var _index : int as readonly Index

  construct(idx : int) {
    super("parameter")
    if (idx < 0) {
      throw new IllegalArgumentException("Parameter index could not be negative but passed value is " + idx)
    }
    this._index = idx
  }
}
