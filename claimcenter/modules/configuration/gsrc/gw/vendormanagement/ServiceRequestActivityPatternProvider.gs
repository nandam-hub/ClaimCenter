package gw.vendormanagement

uses gw.core.vendormanagement.IServiceRequestActivityPatternProvider

/**
 * This class is used by the core version of the Service Requests feature to access the codes that are defined in a
 * customer configuration. Please refer to the upgrade guide on how to optionally adopt the Core version of ServiceRequests.
 *
 * Customers should not use or maintain this class, but should use ServiceRequestActivityPattern direcly.
 */
@Export
class ServiceRequestActivityPatternProvider implements IServiceRequestActivityPatternProvider {
  static var _INSTANCE : ServiceRequestActivityPatternProvider as INSTANCE = new ()

  property get InvoiceNotAutoApproved() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.INVOICE_NOT_AUTO_APPROVED
  }

  property get InvoiceNotAutoPaid() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.INVOICE_NOT_AUTO_PAID
  }

  property get VendorAddedQuote() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_ADDED_QUOTE
  }

  property get VendorCompletedWork() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_COMPLETED_WORK
  }

  property get VendorDeclinedWork() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_DECLINED_WORK
  }

  property get VendorCanceledWork() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_CANCELED_WORK
  }

  property get VendorSentQuestionMessage() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_SENT_QUESTION_MESSAGE
  }

  property get VendorAddedDelay() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_ADDED_DELAY
  }

  property get VendorDidNotAcceptWork() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_DID_NOT_ACCEPT_WORK
  }

  property get VendorPastExpectedQuoteCompletionDate() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_PAST_EXPECTED_QUOTE_COMPLETION_DATE
  }

  property get VendorPastExpectedServiceCompletionDate() : ServiceRequestActivityPattern {
    return ServiceRequestActivityPattern.VENDOR_PAST_EXPECTED_SERVICE_COMPLETION_DATE
  }
}
