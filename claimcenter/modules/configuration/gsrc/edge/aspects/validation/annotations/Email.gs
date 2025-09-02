package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr

class Email implements IMetaFactory {
  override function getState(): Object {
    return new ValidationRuleDTO(
        Expr.call(
            ValidationFunctions#matchesPattern(String, String),
            { Expr.const("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}"), Validation.VALUE }
        ),
        Expr.translate("Edge.Web.Api.Model.Email", {})
    )
  }
}
