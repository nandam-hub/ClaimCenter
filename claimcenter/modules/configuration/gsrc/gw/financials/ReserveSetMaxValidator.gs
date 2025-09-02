package gw.financials

uses gw.api.financials.CurrencyAmount

uses java.math.BigDecimal

/**
 * Utility class for TXV06000Reservethreshold rule.
 *
 * Defaults are one hundred million for JPY and RUB, one million for other currencies
 */
@Export
class ReserveSetMaxValidator {
  private construct() {
  }

  private static final var ONE_MILLION = 1000000bd
  private static final var ONE_HUNDRED_MILLION = 100000000bd

  private static final var MAX_RESERVE_SET_LIMIT = {
      Currency.TC_USD -> ONE_MILLION,
      Currency.TC_EUR -> ONE_MILLION,
      Currency.TC_GBP -> ONE_MILLION,
      Currency.TC_CAD -> ONE_MILLION,
      Currency.TC_AUD -> ONE_MILLION,
      Currency.TC_JPY -> ONE_HUNDRED_MILLION,
      Currency.TC_RUB -> ONE_HUNDRED_MILLION
  }

  /**
   * Return reserve threshold depending on currency
   *
   * @param currency
   * @return threshould value. Return one million if currency is null
   */
  public static function getReserveSetMax(currency : Currency) : BigDecimal {
    return MAX_RESERVE_SET_LIMIT.get(currency) ?: ONE_MILLION
  }

  /**
   * Check if given currency amount exceeds the reserve threshold
   *
   * @param currencyAmount
   * @return true if the amount is more than its currency's threshold
   */
  public static function exceedsReserveSetMax(currencyAmount : CurrencyAmount) : boolean {
    return currencyAmount.Amount > getReserveSetMax(currencyAmount.Currency)
  }
}