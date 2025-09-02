package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.dto.CategoryFilterDTO
uses edge.aspects.validation.Validation
uses edge.aspects.validation.ValidationFunctions
uses edge.el.dto.ExpressionDTO

class FilterByCategory implements IMetaMultiFactory {

  /** Expression defining a category for the code. */
  private var _categoryExpression: ExpressionDTO
  private var _filterName : String = ""

  construct(pn : String) {
    this._filterName = pn
    this._categoryExpression = Expr.getProperty(pn, Validation.PARENT)
  }

  construct(categoryExpr : ExpressionDTO) {
    this._categoryExpression = categoryExpr;
  }

  override function getState(): Object[] {
    return {
      new ValidationRuleDTO(
        Expr.call(ValidationFunctions#hasCategory(gw.entity.TypeKey, gw.entity.TypeKey),
          {Validation.VALUE, _categoryExpression}),
        Expr.translate("Edge.Web.Api.Model.FilterByCategory", {Expr.const(this._filterName)})
      ),
      new CategoryFilterDTO(_categoryExpression)
    }
  }
}
