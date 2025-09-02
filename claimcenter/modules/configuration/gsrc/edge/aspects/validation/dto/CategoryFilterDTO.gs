package edge.aspects.validation.dto

uses edge.el.dto.ExpressionDTO
uses edge.jsonmapper.JsonProperty

/** Definition of the category-based filter for typekeys. */
final class CategoryFilterDTO {
  /** Expression used to evaluate base (leading) typekey. */
  @JsonProperty
  private var _categoryExpr : ExpressionDTO as CategoryExpression

  construct(exp : ExpressionDTO) {
    this._categoryExpr = exp
  }
}
