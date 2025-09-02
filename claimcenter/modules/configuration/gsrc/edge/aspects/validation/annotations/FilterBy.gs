package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.dto.TypelistFilterDTO
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation

class FilterBy implements IMetaMultiFactory {

  private var _filterName : String

  construct(fn : String) {
    this._filterName = fn
  }

  override function getState(): Object[] {
    return {
      new ValidationRuleDTO(
        Expr.call(ValidationFunctions#belongsToFilter(gw.entity.TypeKey, String), {
          Validation.VALUE, _filterName
        }),
        Expr.translate("Edge.Web.Api.Model.FilterBy", {Expr.const(this._filterName)})
      ),

      new TypelistFilterDTO(_filterName)
    }
  }
}
