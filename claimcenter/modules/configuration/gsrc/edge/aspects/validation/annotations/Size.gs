package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.metadata.annotation.IMetaFactory
uses edge.el.Expr
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.aspects.validation.Validation

class Size implements IMetaFactory {
  var _min: ExpressionDTO;
  var _max: ExpressionDTO;

  construct(min: int, max : int) {
    _min = Expr.const(min)
    _max = Expr.const(max)
  }

  construct(min: ExpressionDTO, max : ExpressionDTO) {
    _min = min
    _max = max
  }

  override function getState(): Object {
    return new ValidationRuleDTO(
        Expr.isNot(
            Expr.some({
                Expr.lessThan(Expr.getProperty("length", Validation.VALUE), _min),
                Expr.greaterThan(Expr.getProperty("length", Validation.VALUE), _max)
            })
        ),
        Expr.translate("Edge.Web.Api.Model.Size", {_min, _max}))
  }
}
