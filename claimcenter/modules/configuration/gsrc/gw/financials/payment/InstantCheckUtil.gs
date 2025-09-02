package gw.financials.payment

uses com.google.common.collect.ImmutableMap
uses gw.api.database.Query
uses gw.api.financials.paymentgateway.InstantPaymentReference
uses gw.api.financials.paymentgateway.InstantPaymentStatus
uses gw.api.locale.DisplayKey
uses gw.api.system.CCConfigParameters
uses gw.plugin.Plugins
uses gw.plugin.financials.paymentgateway.OutboundInstantPaymentGatewayPlugin
uses org.json.simple.JSONObject

/**
 * A utility class for Instant Check payments.
 */
@Export
class InstantCheckUtil {

  public static function shouldMakeOutboundPayment(check : Check) : boolean {
    return allowInstantCheck(check)
        and check.PaymentMethod == PaymentMethod.TC_INSTANT
        and (shouldInitiateInstantPayment(check) or shouldStopInstantPayment(check))
  }

  public static function allowInstantCheck(check : Check) : boolean {
    return CCConfigParameters.InstantPaymentIntegrationEnabled.Value
        and check.Payees.length == 1
        and (check.FirstPayee.Payee == null or check.FirstPayee.Payee typeis Person)
  }

  public static function shouldShowInstantPmtStatus(check : Check) : boolean {
    return CCConfigParameters.InstantPaymentIntegrationEnabled.Value
        and check.PaymentMethod == PaymentMethod.TC_INSTANT
  }

  public static function shouldInitiateInstantPayment(check : Check) : boolean {
    return check.Status == TransactionStatus.TC_REQUESTING
  }

  public static function shouldStopInstantPayment(check : Check) : boolean {
    return check.Status == TransactionStatus.TC_PENDINGSTOP
  }

  /**
   * For an instant payment check with certain check statuses e.g.,{@link TransactionStatus#TC_ISSUED}, some vendors may
   * choose to disable 'STOP' operation. {@link OutboundInstantPaymentGatewayPlugin#supportsStopInstantPayment(InstantPaymentStatus)}
   * provides the implementers the option to disable the STOP operation. OOTB, we enabled the STOP
   * operation on {@link TransactionStatus#TC_ISSUED} check.
   * Note: This method returns "true" if the check is not an Instant payment or the Instant payment feature is disabled.
   */
  public static function stopIsSupported(check : Check) : boolean {
    if (shouldShowInstantPmtStatus(check)) {
      var plugin = Plugins.get(OutboundInstantPaymentGatewayPlugin)
      if (TransactionStatusToInstantPaymentStatusMapper.containsKey(check.Status)) {
        return plugin.supportsStopInstantPayment(TransactionStatusToInstantPaymentStatusMapper.get(check.Status))
      }
    }
    return true
  }

  /**
   * A mapper for check statuses {@link TransactionStatus#TC_PENDINGSTOP}
   * {@link TransactionStatus#TC_STOPPED} to their end statuses.
   */
  public static property get StopCheckStatusMap() : Map<TransactionStatus, TransactionStatus> {
    var checkStatusMap = ImmutableMap.of<TransactionStatus, TransactionStatus>(
        TransactionStatus.TC_PENDINGSTOP, TransactionStatus.TC_STOPPED,
        TransactionStatus.TC_STOPPED, TransactionStatus.TC_STOPPED)
    return checkStatusMap
  }

  /**
   * A mapper to convert a check's {@link TransactionStatus} to {@link InstantPaymentStatus}
   */
  public static property get TransactionStatusToInstantPaymentStatusMapper() : Map<TransactionStatus, InstantPaymentStatus> {
    var statusMap = ImmutableMap.of<TransactionStatus, InstantPaymentStatus>(
        TransactionStatus.TC_REQUESTED, InstantPaymentStatus.INITIATED,
        TransactionStatus.TC_REQUESTING, InstantPaymentStatus.INITIATED,
        TransactionStatus.TC_ISSUED, InstantPaymentStatus.ISSUED,
        TransactionStatus.TC_CLEARED, InstantPaymentStatus.COMPLETED,
        TransactionStatus.TC_STOPPED, InstantPaymentStatus.CANCELED)
    return statusMap
  }

  public static function isNewPayoutId(payoutId : String) : boolean {
    return Query.make(Check)
        .compare(Check#InstantPmtExternalID, Equals, payoutId)
        .select().isEmpty()
  }

  /**
   * Set the following check fields if provided:
   * <ul>
   *   <li>InstantPmtExternalId</li>
   *   <li>InstantPmtVendorStatus</li>
   *   <li>InstantPmtVendorStatusDesc</li>
   * </ul>
   * @param response
   * @param checkToUpdate
   */
  static function updateInstantPaymentFieldsFromInitiate(response : InstantPaymentReference, checkToUpdate : Check) {
    checkToUpdate.InstantPmtExternalID = response.getPayoutId()
    checkToUpdate.InstantPmtVendorStatus = response.VendorStatus
    checkToUpdate.InstantPmtVendorStatusDesc = response.VendorStatusDescription
    if (checkToUpdate.CheckNumber == null && response.PublicPayoutReference != null && !response.PublicPayoutReference.isBlank()) {
      checkToUpdate.CheckNumber = response.PublicPayoutReference
    }
  }

  /**
   * <ul>
   *   <li>PublicId: the {@link entity.Check}#PublicID</li>
   *   <li>Message: details that the check is requesting for an event</li>
   *   <li>OriginalStatus: for {@link entity.Check}#Status</li>
   *   </ul>
   * @param messageContext a {@link MessageContext} containing a {@link entity.Check} as its root.
   * @return a string of JSON containing information about the check and its original status.
   */
  public static function createMessagePayload(messageContext : MessageContext) : String {
    var check = messageContext.Root as Check

    var payloadMap = new JSONObject()
    payloadMap.put("PublicID", check.PublicID)
    payloadMap.put("Message", "Requesting check ${check.PublicID} for event ${messageContext.EventName} - ${check}")
    if (check.getOriginalValue(check#Status).Code != null) {
      payloadMap.put("OriginalStatus", check.getOriginalValue(check#Status).Code)
    } else {
      // setting the current status of Check if prior status is null.
      payloadMap.put("OriginalStatus", check.Status.Code)
    }

    return payloadMap.toJSONString()
  }

  /**
   * Maps InstantPaymentStatus to TransactionStatus. TransactionStatus maps to Check#Status.
   */
  public static function instantPaymentStatusToCheckStatusMapper(status : InstantPaymentStatus, check : Check) : TransactionStatus {
    if (status != null) {
      switch (status) {
        case InstantPaymentStatus.INITIATED:
          return TransactionStatus.TC_REQUESTED
        case InstantPaymentStatus.ISSUED:
          return TransactionStatus.TC_ISSUED
        case InstantPaymentStatus.COMPLETED:
          return TransactionStatus.TC_CLEARED
        case InstantPaymentStatus.CANCELED:
          return InstantCheckUtil.StopCheckStatusMap.get(check.Status)
        case InstantPaymentStatus.FAILED:
          return InstantCheckUtil.StopCheckStatusMap.get(check.Status)
        default:
          throw new IllegalArgumentException("Status '" + status + "'  is invalid. Valid status values are - INITIATED,ISSUED,COMPLETED,CANCELED,FAILED,null.")
      }
    }
    return null
  }

  public static function createAndAssignActivity(check : Check) {
    var activity = check.Claim.createActivityFromPattern(null, ActivityPattern.finder.getActivityPatternByCode("general_warning"))
    activity.Subject = DisplayKey.get("AdminData.ActivityPattern.Subject.Instant_Check_Failure")
    activity.Description = DisplayKey.get("AdminData.ActivityPattern.Description.Instant_Check_Failure", check.PayTo, check.NetAmountDisplayValue, check.ScheduledSendDate)

    activity.assignUserAndDefaultGroup(check.CreateUser)
  }

  public static function getPaymentMethods(check : Check) : List<PaymentMethod> {
    if (allowInstantCheck(check)) {
      return PaymentMethod.TF_PERSONCHECKPAYEE.TypeKeys
    }

    return PaymentMethod.TF_NONPERSONCHECKPAYEE.TypeKeys
  }

  public static function validateInstantPaymentReference(paymentReference : InstantPaymentReference, check : Check) : boolean {
    if (paymentReference.PayoutId == null || paymentReference.PayoutId.trim().isEmpty()){
      throw new IllegalStateException("InstantPayment for Check#PublicID:${check.PublicID} received an InstantPaymentReference with no payout id")
    }
    if (paymentReference.VendorStatus == null || paymentReference.VendorStatus.trim().isEmpty()) {
      throw new IllegalStateException("InstantPayment for Check#PublicID:${check.PublicID} received an InstantPaymentReference with no vendorStatus")
    }
    return true
  }

  public static function instantPaymentGrossAmountValidation(check : Check) : boolean {
    return (check.PaymentMethod == PaymentMethod.TC_INSTANT
        and check.Status != TransactionStatus.TC_STOPPED and check.Status != TransactionStatus.TC_VOIDED
        and check.Status != TransactionStatus.TC_PENDINGSTOP and check.Status != TransactionStatus.TC_PENDINGVOID
        and check.GrossAmount.Amount <= 0bd)
  }
}
