package edge.aspects.validation.dto

uses edge.el.dto.ExpressionDTO
uses edge.jsonmapper.JsonProperty

/** Rule defining a visibility of the property. This value is supported for properties only. */
final class VisibilityAndRequirednessRuleDTO implements IAugment {

  /** Visibility/requiredness expression. Must return a value of VisibilityAndRequiredness. */
  @JsonProperty
  private var _expr : ExpressionDTO as readonly Expression

  /** Validation message. */
  @JsonProperty
  private var _message : ExpressionDTO as readonly Message


  construct(e : ExpressionDTO, m : ExpressionDTO) {
    this._expr = e
    this._message = m
  }
}
