package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.el.Expr
uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.dto.ValidationRuleDTO

class Pattern implements IMetaFactory {
  var _patternExp: ExpressionDTO;
  var _msgExp : ExpressionDTO

  construct(pattern: String) {
    this(pattern,"Edge.Web.Api.Model.Pattern")
  }

  construct(pattern: String, msgKey:String) {
    _patternExp = Expr.const(pattern)
    _msgExp = Expr.translate(msgKey, {})
  }

  construct(exp: ExpressionDTO) {
    _patternExp = exp
  }

  override function getState(): Object {
    return new ValidationRuleDTO(
        Expr.call(ValidationFunctions#matchesPattern(String, String), {_patternExp, Validation.VALUE}), _msgExp)
  }
}
