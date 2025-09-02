package edge.aspects.validation.annotations

uses edge.metadata.annotation.IMetaFactory
uses edge.aspects.validation.dto.ValidationRuleDTO
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses gw.api.util.DateUtil
uses java.util.Date
uses edge.time.LocalDateUtil
uses edge.time.LocalDateDTO

/**
* Validates that date portion of the property is less than the current date.
 */
class PastLocalDate implements IMetaFactory {
  override function getState(): Object {
    return new ValidationRuleDTO(
        Expr.greaterThan(
          Expr.call(DateUtil#compareIgnoreTime(Date,Date),{
            Expr.call(DateUtil#currentDate(), {} ),
            Expr.call(LocalDateUtil#toMidnightDate(LocalDateDTO), { Validation.VALUE} )
          }
        ), Expr.const(0)
      ),
      Expr.translate("Edge.Web.Api.Model.PastDate",{})
    )
  }
}
