package gw.entity

uses gw.api.financials.BulkInvoiceItemMethods
uses gw.api.financials.CurrencyAmount
uses gw.api.financials.FinancialsCalculations
uses gw.api.financials.FinancialsUtil
uses gw.api.locale.DisplayKey
uses gw.api.system.CCConfigParameters
uses gw.api.util.CCCurrencyUtil
uses gw.api.util.CurrencyUtil
uses gw.pl.util.BigDecimalUtil

uses java.math.BigDecimal

@Export
class BulkInvoiceItemMethodsImpl implements BulkInvoiceItemMethods {
  var _item : BulkInvoiceItem

  construct(item : BulkInvoiceItem) {
    _item = item
  }

  override function validateForSubmission() : boolean {
    // check whether invoice item exceeds reserves, and if so whether this is allowed
    var check = _item.BulkInvoiceItemInfo.Check
    if (!CCConfigParameters.AllowPaymentsExceedReservesLimits.Value) {
      if ((check == null or check.Status == TransactionStatus.TC_DRAFT)
              and (ExceedsAvailableReserves and !canExceedAvailableReservesRegardlessOfLimit())) {
        _item.Explanation = DisplayKey.get("Web.Financials.BulkPay.Error.InvoiceItemExceedsReserves")
        return false
      }
    }

    // check whether payment type is valid
    if (!_item.getValidPaymentTypes().contains(_item.PaymentType)) { //supplemental payment type on open claim/exp
      _item.Explanation = DisplayKey.get("Web.Financials.BulkPay.Error.InvalidPaymentType")
      return false
    }

    return true
  }

  private function canExceedAvailableReservesRegardlessOfLimit(): boolean {
    return FinancialsUtil.canExceedAvailableReservesRegardlessOfLimit(_item)
  }

  private property get ExceedsAvailableReserves(): boolean {
    var reserveLine = _item.ReserveLine
    var reservingCurrency = reserveLine == null ? _item.ReservingCurrency : reserveLine.ReservingCurrency
    var availableReserves = AvailableReserves
    availableReserves = (null == availableReserves) ? CCCurrencyUtil.get(BigDecimalUtil.ZERO, reservingCurrency) : availableReserves
    var manualRate: BigDecimal
    if (CurrencyUtil.ReportingCurrency == reservingCurrency && _item.BulkInvoice.OverrideTransToReportingExchangeRate) {
      manualRate = _item.BulkInvoice.TransToReportingExchangeRateRate
    }
    var reservingAmount = _item.Amount.convert(reservingCurrency, manualRate, CCCurrencyUtil.getRoundingMode(Payment.TYPE.get()));
    return availableReserves < reservingAmount
  }

  private property get AvailableReserves(): CurrencyAmount {
    var reserveLine = _item.ReserveLine
    if (reserveLine != null) {
      return FinancialsCalculations.AvailableReserves.withReserveLine(reserveLine).getReservingAmount()
    }

    var calculator = FinancialsCalculations
        .AvailableReserves
        .withClaim(_item.Claim)
        .withCostType(_item.CostType)
        .withCostCategory(_item.CostCategory)
        .withReservingCurrency(_item.ReservingCurrency)

    var exposure = _item.Exposure
    if (exposure == null) {
      calculator.useClaimLevelReserves()
    } else {
      calculator.withExposure(exposure)
    }
    return calculator.ReservingAmount
  }
}