package edge.capabilities.claim.fnol.metadata.validation.annotations

uses edge.aspects.validation.annotations.FilterByCategory
uses edge.el.Expr
uses gw.api.util.CurrencyUtil

/**
 * Allows to filter a type list by the default currency
 */
class FilterByCurrency extends FilterByCategory {

  static final var CURRENCY = CurrencyUtil.getDefaultCurrency()

  construct() {
    super(Expr.const(CURRENCY))
  }
}
