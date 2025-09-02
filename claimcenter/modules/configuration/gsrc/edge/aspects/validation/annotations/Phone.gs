package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.aspects.validation.Validation
uses edge.el.Expr
uses gw.api.util.PhoneUtil
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.aspects.validation.dto.ValidationRuleDTO

class Phone implements IMetaMultiFactory {

  private var _countyCode : ExpressionDTO as CountryCode

  construct() {
    _countyCode = Expr.dtoConst(PhoneUtil.getDefaultPhoneCountryCode())
  }

  construct(code :ExpressionDTO) {
    _countyCode = code
  }

  override function getState(): Object[] {
    return {
        new ValidationRuleDTO(
            Expr.call(PhoneUtil#isPossibleNumber(String, PhoneCountryCode), {Validation.VALUE, _countyCode}),
                Expr.translate("Edge.Web.Api.Model.Phone", {})
        )
    }
  }
}
