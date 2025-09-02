package gw.plugin.payment

uses gw.api.database.Relop
uses gw.api.databuilder.UniqueKeyGenerator
uses gw.api.financials.paymentgateway.InstantPaymentReference
uses gw.api.financials.paymentgateway.InstantPaymentStatus
uses gw.api.financials.paymentgateway.Payout
uses gw.api.financials.paymentgateway.Recipient
uses gw.financials.payment.InstantPaymentReferenceBase
uses gw.plugin.financials.paymentgateway.OutboundInstantPaymentGatewayPlugin

/**
 * Demo implementation of the OutboundInstantPaymentGatewayPlugin. This plugin can be used to demo/test instant check
 * payment operations OOTB.
 */
@Export
class DemoOutboundInstantPaymentGatewayPlugin implements OutboundInstantPaymentGatewayPlugin {

  override function initiateInstantPayment(recipient : Recipient, payout : Payout, claimNumber : String, policyNumber : String, metadata : Map<String, String>) : InstantPaymentReference {
    var payoutId = UniqueKeyGenerator.get().nextKey()
    var paymentReference = new InstantPaymentReferenceBase()
    paymentReference.PayoutId = payoutId
    paymentReference.PublicPayoutReference = payoutId
    updatePaymentReferenceBasedOnRecipientEmail(recipient, paymentReference)
    return paymentReference
  }

  /**
   * Initiate payment scenario to test - CANCELED, FAILED, and default(successful) states from UI. Recipient'e email address is
   * used for testing/demoing different vendor statuses returned from payment vendor. Example: If recipient's email
   * address starts with 'fail', an activity is created (see InstantCheckUtil#createAndAssignActivity)
   */
  private function updatePaymentReferenceBasedOnRecipientEmail(recipient : Recipient, paymentReference : InstantPaymentReferenceBase) {
    if (recipient.Email?.startsWithIgnoreCase("Fail")) {
      paymentReference.Status = InstantPaymentStatus.FAILED
      paymentReference.VendorStatus = "FAILED"
    } else if (recipient.Email?.startsWithIgnoreCase("cancel")) {
      paymentReference.Status = InstantPaymentStatus.CANCELED
      paymentReference.VendorStatus = "Canceled"
    } else {
      paymentReference.Status = InstantPaymentStatus.INITIATED
      paymentReference.VendorStatus = "Initiated"
    }
  }

  override function cancelInstantPayment(payoutId : String) : InstantPaymentReference {
    var paymentReference = new InstantPaymentReferenceBase()
    paymentReference.PayoutId = payoutId
    var cancellationComment = getCheckCancellationComment(payoutId)
    // Cancellation scenario for tests - CANCELED/FAILED, COMPLETED and null
    if (cancellationComment?.startsWithIgnoreCase("COMPLETE")) {
      paymentReference.Status = InstantPaymentStatus.COMPLETED
      paymentReference.VendorStatus = "InvalidRequest"
      paymentReference.VendorStatusDescription = "Approval request is already in final state"
    } else if (cancellationComment?.startsWithIgnoreCase("FAIL")) {
      paymentReference.Status = InstantPaymentStatus.FAILED
      paymentReference.VendorStatus = "Failed"
      paymentReference.VendorStatusDescription = "Cancellation failed"
    } else if (cancellationComment?.startsWithIgnoreCase("NULL")) {
      paymentReference.Status = null
      paymentReference.VendorStatus = "Unknown"
      paymentReference.VendorStatusDescription = "Cancellation Failed for unknown reason"
    } else {
      // successful case CANCELED
      paymentReference.Status = InstantPaymentStatus.CANCELED
      paymentReference.VendorStatus = "Canceled"
      paymentReference.VendorStatusDescription = "Cancellation Succeeded"
    }
    return paymentReference
  }

  override function supportsStopInstantPayment(status : InstantPaymentStatus) : boolean {
    return true
  }

  /**
   * Retrieving the Check cancellation comment. This is used to demo different vendor statuses returned from payment vendor.
   */
  private function getCheckCancellationComment(payoutId : String) : String {
    var check = gw.api.database.Query.make(Check)
        .compare(Check#InstantPmtExternalID, Relop.Equals, payoutId)
        .select().FirstResult
    return check.Comments
  }

}