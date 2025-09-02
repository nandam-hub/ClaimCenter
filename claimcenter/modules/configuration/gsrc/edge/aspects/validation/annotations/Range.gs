package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.Validation
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr

/**
 * Requires a value to be inside the specific range.
 */
class Range implements IMetaMultiFactory {
  /** Lower range bound. */
  private var lower : ExpressionDTO

  /** Upper range bound. */
  private var upper : ExpressionDTO

  /** Expression for the value. */
  private var value : ExpressionDTO


  /** Requires that <code>v</code> is between <code>l</code> and <code>u</code> inclusive. */
  construct(l : Object, u : Object, v : ExpressionDTO) {
    this.lower = Expr.asExpression(l)
    this.upper = Expr.asExpression(u)
    this.value = v
  }

  /** Requires that the annotated property is between <code>l</code> and <code>u</code> inclusive. */
  construct(l: Object, u: Object) {
    this(l, u, Validation.VALUE)
  }

  override function getState(): Object[] {
    return {
      new ValidationRuleDTO(
        Expr.isNot(Expr.lessThan(value, lower)),
        Expr.translate("Edge.Web.Api.Model.Min", {lower})
      ),
      new ValidationRuleDTO(
        Expr.isNot((Expr.greaterThan(value, upper))),
        Expr.translate("Edge.Web.Api.Model.Max", {upper})
      )
    }
  }
}
