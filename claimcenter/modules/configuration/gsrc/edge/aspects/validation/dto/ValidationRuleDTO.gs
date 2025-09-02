package edge.aspects.validation.dto

uses edge.el.dto.ExpressionDTO
uses edge.jsonmapper.JsonProperty

/** Generic validation rule. This rule defines a validation with a single validation message. */
final class ValidationRuleDTO implements IAugment {
  /** Expression used for the validity. Must return boolean. */
  @JsonProperty
  private var _expr : ExpressionDTO as readonly Expression

  /** Expression used to evaluate a validation message. */
  @JsonProperty
  private var _message : ExpressionDTO as readonly Message

  construct(e : ExpressionDTO, m : ExpressionDTO) {
    this._expr = e
    this._message = m
  }
}
