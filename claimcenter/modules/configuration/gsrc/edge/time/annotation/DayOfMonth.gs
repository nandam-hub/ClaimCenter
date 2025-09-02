package edge.time.annotation

uses edge.aspects.validation.annotations.Range
uses edge.el.Expr
uses edge.time.LocalDateUtil
uses edge.aspects.validation.Validation
uses edge.metadata.annotation.IMetaMultiFactory
uses edge.time.LocalDateDTO

/**
 * Validator for the day of the month.
 */
class DayOfMonth implements IMetaMultiFactory {

  private static final var RULES =
      new Range(1, Expr.call(LocalDateUtil#daysInLocalDate(LocalDateDTO), {Validation.PARENT})).getState()

  override function getState(): Object[] {
    return RULES
  }
}
