package gw.entity

uses gw.core.vendormanagement.servicerequeststate.ServiceRequestOperationContext
uses gw.plugin.Plugins
uses gw.plugin.vendormanagement.IServiceRequestLifecycle
uses gw.vendormanagement.ServiceRequestStatementEditHelper

@Export
enhancement GWServiceRequestQuoteEnhancement : entity.ServiceRequestQuote {
  
  /**
   *  Assign the latest quote to the quote Service Request
   *  and perform the Add/Replace quote operation
   */
  function finishSetup(isSpecialist : boolean) {
    ServiceRequestStatementEditHelper.removeUnusedDocuments(this)
    var context = new ServiceRequestOperationContext() {:Statement = this}
    Plugins.get(IServiceRequestLifecycle).finishQuoteSetup(context, isSpecialist)
    ServiceRequestStatementEditHelper.clearAttachedToStatementDocuments(this)
  }
  
  /**
   * Creates a new quote with values from the current quote copied into it
   * @see gw.plugin.vendormanagement.IServiceRequestLifecycle#initializeServiceRequestQuote(ServiceRequestQuote, ServiceRequestQuote)
   * Returns the new quote
   */
  function copyQuoteForRevision() : ServiceRequestQuote {
    return this.ServiceRequest.CoreSR.createMinimalServiceRequestQuote(this)
  }

  /**
   * Returns true if this quote is approved, false otherwise.
   */
  property get IsApproved(): boolean {
    return this == this.ServiceRequest.LatestQuote and this.ServiceRequest.QuoteStatus == ServiceRequestQuoteStatus.TC_APPROVED
  }
}
