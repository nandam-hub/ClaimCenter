package edge.PlatformSupport

uses gw.api.financials.CurrencyAmount
uses gw.pl.currency.MonetaryAmount

/**
 * Provides platform-specific methods for currency.
 */
class CurrencyPlatformUtil {
  static function toCurrencyAmount(value: MonetaryAmount) : CurrencyAmount {
    return value?.toCurrencyAmount()
  }

  static function toCurrencyAmount(value: CurrencyAmount) : CurrencyAmount {
    return value
  }
}
