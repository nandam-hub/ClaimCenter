package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.ValidationFunctions

class PhoneNumberPresent implements IMetaFactory {

  private var _when : ExpressionDTO as When

  construct() {
  }

  construct(w : ExpressionDTO) {
    this._when = w
  }

  override function getState(): Object {
    var validity = Expr.any({
            Expr.isNot(Expr.call(ValidationFunctions#isEmpty(String),{Expr.getProperty("HomeNumber", Validation.VALUE)})),
            Expr.isNot(Expr.call(ValidationFunctions#isEmpty(String),{Expr.getProperty("WorkNumber", Validation.VALUE)})),
            Expr.isNot(Expr.call(ValidationFunctions#isEmpty(String),{Expr.getProperty("CellNumber", Validation.VALUE)}))
        })

    return _when == null ?
        new ValidationRuleDTO(validity, Expr.translate("Edge.Web.Api.Model.ContactPhoneNumber",{})) :
        new ValidationRuleDTO(
            Validation.conditionally(_when, validity),
            Expr.translate("Edge.Web.Api.Model.ContactPhoneNumber",{})
        )
  }
}
