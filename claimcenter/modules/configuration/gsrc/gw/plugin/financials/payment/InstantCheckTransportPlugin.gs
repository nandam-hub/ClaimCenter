package gw.plugin.financials.payment

uses gw.api.financials.paymentgateway.InstantPaymentReference
uses gw.api.financials.paymentgateway.InstantPaymentStatus
uses gw.api.financials.paymentgateway.Payout
uses gw.api.financials.paymentgateway.Recipient
uses gw.api.financials.paymentgateway.RecipientAddress
uses gw.api.intentionallogging.IntentionalLogger
uses gw.api.system.PLLoggerCategory
uses gw.financials.payment.InstantCheckUtil
uses gw.pl.logging.ElapsedTime
uses gw.pl.util.ArgCheck
uses gw.plugin.Plugins
uses gw.plugin.financials.paymentgateway.OutboundInstantPaymentGatewayPlugin
uses gw.plugin.messaging.MessageTransport

uses java.util.concurrent.TimeUnit

uses gw.api.system.CCLoggingMarker#INSTANT_PAYMENT

/**
 * Implementation of MessageTransport for instant check payment. This transport plugin uses the
 * event name and check's status to invoke a synchronous remote call out to PaymentGateway vendor to perform check
 * operations related to instant check payment like issuing/canceling instant check payment.
 */
@Export
class InstantCheckTransportPlugin implements MessageTransport {

  private static final var IL = IntentionalLogger.from(PLLoggerCategory.MESSAGING)
  public static final var DEST_ID : int = 71

  override function send(message : Message, transformedPayload : String) {
    ArgCheck.satisfiesCriteria(message.MessageRoot typeis Check, "InstantCheckTransportPlugin expects a Check entity as MessageRoot")
    var check = message.MessageRoot as Check

    //PaymentGateway plugin to make remote API calls for issuing/cancelling an instant payment
    var plugin = Plugins.get(OutboundInstantPaymentGatewayPlugin)
    var startTime = System.currentTimeMillis()
    var paymentReference : InstantPaymentReference

    if (InstantCheckUtil.shouldInitiateInstantPayment(check)) {
      IL.logDebugEvent(INSTANT_PAYMENT, "Sending instant payment check to payment gateway: ${transformedPayload} ")
      var recipient = createRecipient(check)

      var payout = createPayout(check)
      try {
        IL.logStart(INSTANT_PAYMENT, "Initiating API call to PaymentGateway provider to issue payment for check with public ID ${check.PublicID} ")
        paymentReference = plugin.initiateInstantPayment(recipient, payout, check.Claim.ClaimNumber, check.Claim.Policy.PolicyNumber, null)
      } finally {
        IL.logStop(INSTANT_PAYMENT, ElapsedTime.of(System.currentTimeMillis() - startTime, TimeUnit.MILLISECONDS))
      }

      validateInitiateInstantPaymentResponse(paymentReference, check)
      final var instantPaymentStatus = paymentReference.Status
      switch (instantPaymentStatus) {
        case INITIATED:
        case COMPLETED:
        case ISSUED:
          IL.logResult(INSTANT_PAYMENT, "InstantPayment created for Check#PublicID:${check.PublicID}, InstantPmtExternalID: ${paymentReference.PayoutId} with  InstantPaymentStatus: ${instantPaymentStatus}")
          handleInitiateInstantPaymentResponse(paymentReference, check)
          message.reportAck()
          break
        case FAILED:
          InstantCheckUtil.createAndAssignActivity(check)
          InstantCheckUtil.updateInstantPaymentFieldsFromInitiate(paymentReference, check)
          IL.logFail(INSTANT_PAYMENT, "Payment request to issue check with public ID ${check.PublicID} is received and is on status ${instantPaymentStatus}")
          message.reportAck()
          break
        case CANCELED:
        default:
          IL.logFail(INSTANT_PAYMENT, "InstantPayment for Check#PublicID:${check.PublicID} received an unexpected response to when initiating instant payment: :" + instantPaymentStatus)
          message.reportError()
      }
    } else if (InstantCheckUtil.shouldStopInstantPayment(check)) {
      var currentCheckStatus = check.Status
      // remote API call for cancellation
      if (check.InstantPmtExternalID == null || check.InstantPmtExternalID.trim().isEmpty()) {
        IL.logFail(INSTANT_PAYMENT, "Payment request to cancel check with public ID ${check.PublicID} has no InstantPmtExternalID.")
      } else {
        try {
          IL.logStart(INSTANT_PAYMENT, "Initiating API call to PaymentGateway provider to cancel payment for check with public ID ${check.PublicID} ")
          paymentReference = plugin.cancelInstantPayment(check.InstantPmtExternalID)
        } finally {
          IL.logStop(INSTANT_PAYMENT, "Payment request to cancel check with public ID ${check.PublicID} is received and is on status ${paymentReference.Status}", ElapsedTime.of(System.currentTimeMillis() - startTime, TimeUnit.MILLISECONDS))
        }
        InstantCheckUtil.validateInstantPaymentReference(paymentReference, check)
        updateInstantPaymentCheckFieldsForCancellation(check, paymentReference, currentCheckStatus)
        message.reportAck()
      }
    } else {
      IL.logFail(INSTANT_PAYMENT, "InstantCheckTransportPlugin: Received check in status ${check.Status} with payment method ${check.PaymentMethod}. A message should not be created in EventFired rules for a Check that does not pass the InstantCheckUtil.shouldInitiateInstantPayment( check ) or InstantCheckUtil.shouldStopInstantPayment( check )  call.")
    }
  }

  /**
   * Updates check status for cancellation based on the {@link InstantPaymentStatus}
   * For {@link InstantPaymentStatus#CANCELED}/{@link InstantPaymentStatus#FAILED} -> updates check status to Stopped
   * For {@link InstantPaymentStatus#COMPLETED} -> update Check to CLEARED
   * For a {@link InstantPaymentStatus} with null -> no Check status update. Remains in PendingStop, Vendor
   * will update check status asynchronously with a call to the REST API
   * Also, updates the Instant Payment fields on Check
   */
  private function updateInstantPaymentCheckFieldsForCancellation(check : Check, paymentReference : InstantPaymentReference, checkCurrentStatus : TransactionStatus) {

    var issueDateCalendarFmt = getIssueDateInCalendarFormat(paymentReference.IssueDate)
    if (paymentReference.Status == InstantPaymentStatus.CANCELED or paymentReference.Status == InstantPaymentStatus.FAILED) {
      check.updateCheckStatus(paymentReference.PublicPayoutReference, issueDateCalendarFmt, InstantCheckUtil.StopCheckStatusMap.get(checkCurrentStatus))
      IL.logResult(INSTANT_PAYMENT, "Acknowledging cancellation of an Instant Payment check with public ID ${check.PublicID}, PayoutID : ${paymentReference.PayoutId} and ${paymentReference.Status}")
    } else if (paymentReference.Status == InstantPaymentStatus.COMPLETED) {
      check.updateCheckStatus(paymentReference.PublicPayoutReference, issueDateCalendarFmt, TransactionStatus.TC_CLEARED)
      IL.logResult(INSTANT_PAYMENT, "Cancellation of an Instant Payment check with public ID ${check.PublicID}, PayoutID : ${paymentReference.PayoutId} is already processed. Updating the check status to ${paymentReference.Status}")
    } else if (paymentReference.Status == null) {
      // no check status updates
      IL.logResult(INSTANT_PAYMENT, "Cancellation of an Instant Payment check with public ID ${check.PublicID}, PayoutID : ${paymentReference.PayoutId} failed. Check will remain in status ${check.Status}")
    }
    check.InstantPmtVendorStatus = paymentReference.VendorStatus
    check.InstantPmtVendorStatusDesc = paymentReference.VendorStatusDescription
  }

  /**
   * Helper method to convert a Date to Calendar format
   */
  private function getIssueDateInCalendarFormat(issueDate : Date) : Calendar {
    var issueDateCalendarFmt : Calendar = null
    if (issueDate != null) {
      issueDateCalendarFmt = Calendar.getInstance()
      issueDateCalendarFmt.setTime(issueDate)
    }
    return issueDateCalendarFmt
  }

  private function createPayout(check : Check) : Payout {
    return new Payout() {
      :Amount = check.SinglePayment.Amount,
      :Currency = check.Currency.Code
    };
  }

  private function createRecipient(check : Check) : Recipient {
    var payee = check.FirstPayee.Payee as Person

    return new Recipient() {
      :FirstName = payee.FirstName,
      :LastName = payee.LastName,
      :Email = check.InstantPmtPayeeEmail,
      :PhoneNumber = check.InstantPmtPayeeCellPhone,
      :Address = new RecipientAddress() {
        :AddressLine1 = payee.PrimaryAddress.AddressLine1,
        :AddressLine2 = payee.PrimaryAddress.AddressLine2,
        :City = payee.PrimaryAddress.City,
        :State = payee.PrimaryAddress.State.Code,
        :PostalCode = payee.PrimaryAddress.PostalCode,
        :Country = payee.PrimaryAddress.Country.Code
      }
    }
  }

  override function shutdown() {

  }

  override function suspend() {

  }

  override function resume() {

  }

  override property set DestinationID(destinationID : int) {

  }

  /**
   * This method should be called with the result of {@link OutboundInstantPaymentGatewayPlugin#initiateInstantPayment(gw.api.financials.paymentgateway.Recipient, gw.api.financials.paymentgateway.Payout, String, String, Map<java.lang.Object,java.lang.Object>)}
   * Throws an exception if:
   * <ul>
   * <li>initiateResponse is null</li>
   * <li>the Status on initiateResponse is null</li>
   * <li>the response provides a payoutId is null or empty</li>
   * <li>the response provides a payoutId that already exists</li>
   * <li>the check payment method is not Instant</li>
   * </ul>
   *
   * @param paymentReference
   * @param check
   * @return true if the check and payment reference are valid.
   * @throws IllegalStateException if we cannot process the response
   */
  protected static function validateInitiateInstantPaymentResponse(initiateResponse : InstantPaymentReference, check : Check) : boolean {
    if (initiateResponse == null) {
      throw new IllegalStateException("InstantPayment for Check#PublicID:${check.PublicID} received a null response")
    }

    InstantCheckUtil.validateInstantPaymentReference(initiateResponse, check)
    if (initiateResponse.Status == null) {
      throw new IllegalStateException("InstantPayment for Check#PublicID:${check.PublicID} received an response with no status")
    }
    if (!InstantCheckUtil.isNewPayoutId(initiateResponse.PayoutId)){
      throw new IllegalStateException("InstantPayment for Check#PublicID:${check.PublicID} received an response with a duplicate InstantPmtExternalID")
    }
    if (PaymentMethod.TC_INSTANT != check.PaymentMethod) {
      throw new IllegalStateException("Cannot apply an InstantPayment for Check#PublicID:${check.PublicID} with non-instant payment method: " + check.PaymentMethod)
    }
    return true
  }

  protected static function handleInitiateInstantPaymentResponse(response : InstantPaymentReference, checkToUpdate : Check) {
    ArgCheck.nonNull(response, "response")
    ArgCheck.nonNull(checkToUpdate, "checkToUpdate")
    var instantPaymentStatus = response.Status
    if (instantPaymentStatus == null) {
      throw new IllegalArgumentException("InstantPaymentReference cannot have a null Status")
    }
    if (checkToUpdate.InstantPmtExternalID != null) {
      throw new IllegalStateException("Invalid Check, InstantPmtExternalID already exists")
    }
    if (checkToUpdate.PaymentMethod != PaymentMethod.TC_INSTANT) {
      throw new IllegalStateException("Cannot update check from InstantPayment, payment method should be 'instant' but was " + checkToUpdate.PaymentMethod)
    }
    if (checkToUpdate.Status != TransactionStatus.TC_REQUESTING) {
      throw new IllegalStateException("Cannot update check from InstantPayment, check should be 'requesting' but was " + checkToUpdate.Status)
    }
    if (instantPaymentStatus == InstantPaymentStatus.FAILED) {
      throw new IllegalArgumentException("Cannot call handleInitiateInstantPayment with a 'failed' response")
    }
    var transactionStatus = InstantCheckUtil.instantPaymentStatusToCheckStatusMapper(instantPaymentStatus, checkToUpdate)
    InstantCheckUtil.updateInstantPaymentFieldsFromInitiate(response, checkToUpdate)
    checkToUpdate.acknowledgeSubmission()
    var issueDate = checkToUpdate.IssueDate?.toCalendar()
    checkToUpdate.updateCheckStatus(checkToUpdate.CheckNumber, issueDate, transactionStatus)
  }
}