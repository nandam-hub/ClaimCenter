package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.el.dto.ExpressionDTO

class Year implements IMetaFactory {

  private var _possibleStart : ExpressionDTO as PossibleStart
  private var _possibleEnd : ExpressionDTO as PossibleEnd

  construct() {
    this(Expr.const(1900), Expr.const(2999))
  }

  construct(aPossibleStart :ExpressionDTO, aPossibleEnd : ExpressionDTO) {
    _possibleStart = aPossibleStart
    _possibleEnd = aPossibleEnd
  }

  override function getState(): Object {
    return new ValidationRuleDTO(Validation.rangeInclusive(_possibleStart, _possibleEnd, Validation.VALUE),Expr.translate("Edge.Web.Api.Model.Year", {_possibleStart, _possibleEnd}))
  }
}
