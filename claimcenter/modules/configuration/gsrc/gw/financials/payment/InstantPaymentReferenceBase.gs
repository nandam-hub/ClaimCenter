package gw.financials.payment

uses gw.api.financials.paymentgateway.InstantPaymentReference
uses gw.api.financials.paymentgateway.InstantPaymentStatus

/**
 * Base implementation of {@link InstantPaymentReference}
 */
@Export
class InstantPaymentReferenceBase implements InstantPaymentReference {

  var _payoutId : String as PayoutId
  var _publicPayoutReference : String as PublicPayoutReference
  var _status : InstantPaymentStatus as Status
  var _vendorStatus : String as VendorStatus
  var _statusDescription : String as VendorStatusDescription
  var _issueDate : Date as IssueDate

}