package edge.aspects.validation.annotations

uses gw.entity.TypeKey
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.dto.TypekeyListFilterDTO

/**
 * Restriction on the typekey. Typekey should be in a list of explicit values.
 */
class TypeKeyIn implements IMetaMultiFactory {
  private var _values : TypeKey[]
  construct(v: TypeKey[]) {
    this._values = v
  }

  override function getState(): Object[] {
    return {
      new ValidationRuleDTO(
        Expr.call(ValidationFunctions#typekeyIn(gw.entity.TypeKey, gw.entity.TypeKey[]), {Validation.VALUE, Expr.dtoConst(_values)}),
        Expr.translate("Edge.Web.Api.Model.FilterBy", {})
      ),
      new TypekeyListFilterDTO(_values)
    }
  }
}
