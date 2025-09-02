package edge.capabilities.claim.fnol.metadata.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses gw.api.util.DateUtil
uses java.util.Date

/**
 * Validates that loss date is an instant in the past
 */
class PastLossDate implements IMetaFactory {
  override function getState(): Object {
    return new ValidationRuleDTO(
        Expr.lessThan(
            Validation.VALUE,
                Expr.call(DateUtil#currentDate(),{})
        ),
            Expr.translate("Edge.Web.Api.Model.PastDate",{})
    )
  }
}
