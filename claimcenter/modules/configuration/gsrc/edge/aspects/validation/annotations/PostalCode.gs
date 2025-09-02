package edge.aspects.validation.annotations

uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.aspects.validation.Validation
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.util.AddressUtil

class PostalCode implements IMetaMultiFactory {
  static var _postalCodePattern = AddressUtil.getPostalCodePattern()

  override function getState(): Object[] {
    if (_postalCodePattern != null) {
      return {
          new ValidationRuleDTO(
              Expr.call(ValidationFunctions#matchesPattern(String, String), {_postalCodePattern, Validation.VALUE}),
              Expr.translate("Edge.Web.Api.Model.PostalCode", {})
          )
      }
    } else {
      return {}
    }
  }
}
