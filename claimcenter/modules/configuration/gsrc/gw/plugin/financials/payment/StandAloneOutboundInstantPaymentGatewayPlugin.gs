package gw.plugin.financials.payment

uses gw.api.databuilder.UniqueKeyGenerator
uses gw.api.financials.paymentgateway.InstantPaymentReference
uses gw.api.financials.paymentgateway.InstantPaymentStatus
uses gw.api.financials.paymentgateway.Payout
uses gw.api.financials.paymentgateway.Recipient
uses gw.api.intentionallogging.IntentionalLogger
uses gw.api.system.CCLoggerCategory
uses gw.financials.payment.InstantPaymentReferenceBase
uses gw.plugin.financials.paymentgateway.OutboundInstantPaymentGatewayPlugin

uses gw.api.system.CCLoggingMarker#INSTANT_PAYMENT

/**
 * Standalone implementation of Outbound Payment Gateway plugin.
 */
@Export
class StandAloneOutboundInstantPaymentGatewayPlugin implements OutboundInstantPaymentGatewayPlugin {

  private static final var IL = IntentionalLogger.from(CCLoggerCategory.INTEGRATION)

  override function initiateInstantPayment(recipient : Recipient, payout : Payout, claimNumber : String, policyNumber : String, metadata : Map<String, String>) : InstantPaymentReference {
    var payoutId = UniqueKeyGenerator.get().nextKey()
    var paymentReference = new InstantPaymentReferenceBase() {
      :PayoutId = payoutId,
      :PublicPayoutReference = payoutId,
      :Status = InstantPaymentStatus.INITIATED,
      :VendorStatus = "Initiated"
    }
    return paymentReference
  }

  override function cancelInstantPayment(payoutId : String) : InstantPaymentReference {
    var paymentReference = new InstantPaymentReferenceBase() {
      :PayoutId = payoutId,
      :Status = InstantPaymentStatus.CANCELED,
      :VendorStatus = "Canceled",
      :VendorStatusDescription = "Cancellation succeeded"
    }
    return paymentReference
  }

  override function supportsStopInstantPayment(status : InstantPaymentStatus) : boolean {
    IL.logResult(INSTANT_PAYMENT, "Check with ${status} is supported for cancellation by the Payment Gateway system")
    return true
  }

}