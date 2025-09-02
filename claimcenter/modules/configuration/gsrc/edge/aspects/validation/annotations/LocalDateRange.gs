package edge.aspects.validation.annotations

uses edge.el.dto.ExpressionDTO
uses edge.el.Expr
uses edge.aspects.validation.ValidationFunctions
uses edge.aspects.validation.Validation
uses edge.aspects.validation.dto.ValidationRuleDTO
uses java.util.Date
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.capabilities.locale.util.DateFormatter
uses edge.time.LocalDateUtil
uses edge.time.LocalDateDTO

class LocalDateRange implements IMetaMultiFactory {
  private var _min: ExpressionDTO
  private var _max: ExpressionDTO
  private var minFormatted: ExpressionDTO
  private var maxFormatted: ExpressionDTO

  construct(minValue: ExpressionDTO, maxValue: ExpressionDTO) {
    _min = minValue
    _max = maxValue
    minFormatted = Expr.call(DateFormatter#formatShortDate(Date), {_min})
    maxFormatted = Expr.call(DateFormatter#formatShortDate(Date), {_max})
  }

  override function getState(): Object[] {
    return {
        new ValidationRuleDTO(
            Expr.lessThan(
                Expr.call(ValidationFunctions#compareDate(Date, Date), {
                    _min,
                    Expr.call( LocalDateUtil#toMidnightDate(LocalDateDTO), {Validation.VALUE})
                }),
                Expr.const(1)
            ),
            Expr.translate("Edge.Web.Api.Model.DateRange.Min", {minFormatted})
        ),
        new ValidationRuleDTO(
            Expr.greaterThan(
                Expr.call(ValidationFunctions#compareDate(Date, Date), {
                    _max,
                    Expr.call( LocalDateUtil#toMidnightDate(LocalDateDTO), {Validation.VALUE})
                }),
                Expr.const(-1)
            ),
            Expr.translate("Edge.Web.Api.Model.DateRange.Max", {maxFormatted})
        )
    }
  }
}
