package gw.api.financials

uses gw.api.locale.DisplayKey

/**
 * Code for maintaining consistency of payment method-related fields. Currently
 * only implemented for BulkInvoice.
 */
@Export
class PaymentUIHelper {

  var _payment : Payment
  
  construct(payment : Payment) {
    _payment = payment
  }

  property get DeductibleButtonToolTip() : String {
    return _payment.HasDeductibleApplicableCurrency ? null : DisplayKey.get("Web.NewCheckWizard.NewPaymentDetail.DeductibleCurrencyNotApplicable")
  }
}
