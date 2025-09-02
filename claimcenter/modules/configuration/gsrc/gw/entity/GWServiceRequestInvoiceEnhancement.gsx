package gw.entity

uses gw.api.locale.DisplayKey
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestOperationContext
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestInvoiceOperationContext
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestInvoiceOperationDefinitionBase
uses gw.plugin.Plugins
uses gw.plugin.vendormanagement.IServiceRequestLifecycle
uses gw.vendormanagement.ServiceRequestStatementEditHelper
uses gw.vendormanagement.ServiceRequestStatus
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestStateHandler

uses java.util.Collection
uses gw.vendormanagement.ServiceRequestActivityPattern

@Export
enhancement GWServiceRequestInvoiceEnhancement : entity.ServiceRequestInvoice {

  function pay() {
    this.CoreSR.performOperation(ServiceRequestOperation.TC_PAYINVOICE, new ServiceRequestInvoiceOperationContext(), false)
  }

  function finishSetup(isSpecialist : boolean) {

    ServiceRequestStatementEditHelper.removeUnusedDocuments(this)
    var context = new ServiceRequestOperationContext(){:Statement = this}
    Plugins.get(IServiceRequestLifecycle).finishInvoiceSetup(context, isSpecialist)
    ServiceRequestStatementEditHelper.clearAttachedToStatementDocuments(this)
  }
  
  property get IsActive(): boolean {
    return !(this.Status == ServiceRequestInvoiceStatus.TC_REJECTED or this.Status == ServiceRequestInvoiceStatus.TC_WITHDRAWN)
  }

  /**
   * Checks if any of the given operations are available to anyone
   */
  function anyOperationAvailable (operations: Collection<ServiceRequestOperation>, stateHandler : ServiceRequestStateHandler = null): boolean {
    return operations.hasMatch(\ operation -> this.CoreSR.operationAvailable(operation, false, stateHandler))
  }

  /**
   * Gets the action icon for this Invoice 
   */
  property get ActionRequiredIcon(): ServiceRequestStatus {
    return ActionRequiredVisible ? ServiceRequestStatus.ATTENTION : ServiceRequestStatus.NONE
  }
  
  /**
   * Gets whether the invoice action required icon should be displayed
   */
  property get ActionRequiredVisible(): boolean {
    return IsWaitingForApproval or IsWaitingForPayment
  }

  /**
   * Gets the invoice action required message to display
   */
  property get ActionRequiredMessage(): String {
    var answer: String
    if (IsWaitingForApproval) {
      answer = DisplayKey.get('Web.ServiceRequest.Invoice.WaitingForApprovalAlert')
    }
    else if (IsWaitingForPayment) {
      answer = DisplayKey.get('Web.ServiceRequest.Invoice.WaitingForPaymentAlert')
    }
    return answer
  }

  property get HasConsistentCheckCurrency() : boolean {
    if(this.Check != null) {
      return this.Check.Currency == this.ServiceRequest.Currency
    }
    return true
  }

  /**
   * Returns whether this invoice is awaiting manual (user-initiated) approval.
   * @return true if the invoice is WAITINGFORAPPROVAL and auto-approval was attempted but unsuccessful, and false
   * otherwise.
   */
  property get IsWaitingForManualApproval(): boolean {
    return IsWaitingForApproval and this.DeclinedReason.HasContent
  }

  /**
   * @return true if this statement is approved, false otherwise.
   */
  property get IsWaitingForPayment(): boolean {
    return this.Status == ServiceRequestInvoiceStatus.TC_APPROVED
  }

  /**
   * Returns true if this statement is approved, false otherwise.
   */
  property get IsWaitingForApproval(): boolean {
    return this.Status == ServiceRequestInvoiceStatus.TC_WAITINGFORAPPROVAL
  }

  /**
   * Returns true if this statement is paid, false otherwise.
   */
  property get IsPaid(): boolean {
    return this.Status == ServiceRequestInvoiceStatus.TC_CHECKCREATED
  }

}
