package gw.vendormanagement.servicerequeststate

uses gw.core.vendormanagement.servicerequeststate.ActionDefinition
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestInvoiceOperationDefinition
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestOperationDefinition
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestStateHandler

uses java.util.Map

@Export
class ServiceRequestUnmanagedStateHandler extends ServiceRequestStateHandler {

  construct() {}

  private final var SERVICE_REQUEST_OPERATION_DEFINITIONS : Map<ServiceRequestOperation, ServiceRequestOperationDefinition> = {
      ServiceRequestOperation.TC_ADDINVOICE -> ServiceRequestStandardInvoiceOperationDefinitions.AddInvoiceDefinition
  }

  override function getServiceRequestOperationDefinition(operation : ServiceRequestOperation) : ServiceRequestOperationDefinition {
    return SERVICE_REQUEST_OPERATION_DEFINITIONS[operation]
  }

  private final var INVOICE_OPERATIONS_DEFINITIONS = ServiceRequestStandardInvoiceOperationDefinitions.AllInvoiceOperationDefinitions

  override function getInvoiceOperationDefinition(operation : ServiceRequestOperation) : ServiceRequestInvoiceOperationDefinition {
    return INVOICE_OPERATIONS_DEFINITIONS[operation]
  }

  override property get AllowsQuote() : boolean {
    return false
  }

  override property get AllowsInvoices() : boolean {
    return true
  }

  override function isExpectedQuoteCompletionDateApplicable(serviceRequest: ServiceRequest): boolean {
    return false
  }

  override function isExpectedServiceCompletionDateApplicable(serviceRequest: ServiceRequest): boolean {
    return false
  }

  override function isInstructedToProvideQuote(serviceRequest: ServiceRequest): boolean {
    return false
  }

  override function isInstructedToPerformService(serviceRequest: ServiceRequest): boolean {
    return false
  }

  override function getNextAction(serviceRequest : ServiceRequest) : ActionDefinition {
    return ServiceRequestActionHandler.getNextAction(serviceRequest, this)
  }

  override property get InitialProgressState() : ServiceRequestProgress {
    return ServiceRequestProgress.TC_WORKCOMPLETE
  }

  override property get InitialQuoteStatusState() : ServiceRequestQuoteStatus {
    return ServiceRequestQuoteStatus.TC_NOQUOTE
  }

  override property get InitialInvoiceStatusState() : ServiceRequestInvoiceStatus {
    return ServiceRequestInvoiceStatus.TC_WAITINGFORAPPROVAL
  }
  
}
