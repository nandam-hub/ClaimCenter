package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses gw.api.util.DateUtil
uses java.util.Date
uses edge.time.LocalDateUtil
uses edge.time.LocalDateDTO

/**
 * Validates that date portion of the property is greater than the current date.
 */
class FutureLocalDate implements IMetaFactory {
  override function getState(): Object {
    return new ValidationRuleDTO(
      Expr.lessThan(
        Expr.call(DateUtil#compareIgnoreTime(Date,Date),{
            Expr.call(DateUtil#currentDate(), {}),
            Expr.call(LocalDateUtil#toMidnightDate(LocalDateDTO), { Validation.VALUE} )
        }
        ), Expr.const(1)
      ),
      Expr.translate("Edge.Web.Api.Model.FutureDate",{})
    )
  }
}
