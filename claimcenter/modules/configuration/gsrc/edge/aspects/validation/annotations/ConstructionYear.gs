package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.el.dto.ExpressionDTO

class ConstructionYear implements IMetaFactory {

  private var _possibleStart : ExpressionDTO as PossibleStart

  construct() {
    this(Expr.const(1700))
  }

  construct(aPossibleStart :ExpressionDTO) {
    _possibleStart = aPossibleStart
  }

  override function getState(): Object {
    return new ValidationRuleDTO(Validation.yearRangeInclusive(_possibleStart, Validation.VALUE),Expr.translate("Edge.Web.Api.Model.ConstructionYear", {_possibleStart}))
  }
}
