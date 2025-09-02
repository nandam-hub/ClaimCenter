package gw.vendormanagement

uses gw.core.vendormanagement.BaseServiceRequestInvoiceCoreMethodsImpl

/**
 * Subclass of BaseServiceRequestInvoiceCoreMethodsImpl, provided so customers can override methods and properties in the base implementation.
 * This class and its methods should not be used if Core Service Requests feature is disabled.
 * To use this class, please follow the instructions on the product documentation on how to enable the Core Service Requests feature.
 */
@Export
class ServiceRequestInvoiceCoreMethodsImpl extends BaseServiceRequestInvoiceCoreMethodsImpl {

  private final var _coreSR = new ConfigCoreSR();

  construct(serviceRequestInvoice : ServiceRequestInvoice) {
    super(serviceRequestInvoice)
  }

  @Override
  property get CoreSR() : CoreSR {
    //do not comment/remove this line if Core Service Requests feature is disabled
    checkCoreServiceRequestFeatureFlag()
    return _coreSR;
  }

  class ConfigCoreSR extends BaseCoreSR {

    override function completeAnyOpenObsoleteActivities(previousInvoiceStatus : ServiceRequestInvoiceStatus) {
      if (this.outer.ServiceRequestInvoice.Status == previousInvoiceStatus) {
        return
      }
      var obsoletePattern : ActivityPattern
      // if the status used to be "waiting for approval"
      if (previousInvoiceStatus == ServiceRequestInvoiceStatus.TC_WAITINGFORAPPROVAL) {
        obsoletePattern = ActivityPatternProvider.InvoiceNotAutoApproved.Pattern
      }
      // or it used to be "approved" (i.e. waiting for payment)
      else if (previousInvoiceStatus == ServiceRequestInvoiceStatus.TC_APPROVED) {
        obsoletePattern = ActivityPatternProvider.InvoiceNotAutoPaid.Pattern
      }
      // if we've identified an obsolete pattern
      if (obsoletePattern != null) {
        final var anyInvoicesHaveOldStatus = this.outer.ServiceRequestInvoice.ServiceRequest.Invoices.hasMatch(\invoice -> invoice.Status == previousInvoiceStatus)
        // and no invoices have the old status
        if (not anyInvoicesHaveOldStatus) {
          final var activities = this.outer.ServiceRequestInvoice.ServiceRequest.Activities
          // then go ahead and complete any with that pattern
          for (act in activities) {
            if (act.Status == ActivityStatus.TC_OPEN and act.ActivityPattern == obsoletePattern) {
              act.complete()
            }
          }
        }
      }
    }

    override property get CompatibleChecks() : List<Check> {
      var invoice = this.outer.ServiceRequestInvoice

      /*
       * Default criteria:
       *   - Has the same currency as the service request
       *   - Non-recurring
       *   - Single-payee
       */
      return invoice.ServiceRequest.Claim.ChecksQuery.where( \ check -> check.Currency == invoice.ServiceRequest.Currency
          and not check.CheckSet.Recurring
          and not check.isGroupMember(false))
    }
  }
}