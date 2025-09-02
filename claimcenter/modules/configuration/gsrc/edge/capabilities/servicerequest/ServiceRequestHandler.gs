package edge.capabilities.servicerequest

uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.servicerequest.local.IServiceRequestCreationPlugin
uses edge.capabilities.servicerequest.util.ServiceRequestEntity
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.AbstractRpcHandler

uses edge.capabilities.servicerequest.summary.dto.ServiceRequestSummaryDTO
uses edge.capabilities.servicerequest.dto.ServiceRequestDTO
uses edge.capabilities.servicerequest.message.dto.ServiceRequestMessageDTO
uses edge.capabilities.servicerequest.statement.quote.dto.ServiceRequestQuoteDTO
uses edge.capabilities.servicerequest.dto.ServiceRequestActionDTO
uses edge.capabilities.servicerequest.dto.ServiceRequestReportDelayDTO
uses edge.capabilities.servicerequest.dto.ServiceRequestAcceptWorkDTO
uses edge.capabilities.servicerequest.statement.invoice.dto.ServiceRequestInvoiceDTO
uses edge.capabilities.servicerequest.statement.invoice.dto.InvoiceWithdrawalDTO
uses edge.capabilities.servicerequest.message.dto.ServiceRequestGlobalMessagesDTO

uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.system.CCConfigParameters
uses gw.api.system.PLConfigParameters
uses gw.webservice.cc.cc1000.vendormanagement.StatementCreationInstructions
uses gw.webservice.cc.cc1000.vendormanagement.ServiceRequestAPI

uses java.util.ArrayList
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.authorization.Authorizer
uses edge.security.authorization.AuthorityType
uses edge.capabilities.servicerequest.summary.IServiceRequestSummaryPlugin
uses edge.capabilities.servicerequest.statement.quote.IServiceRequestQuotePlugin
uses edge.capabilities.servicerequest.statement.invoice.IServiceRequestInvoicePlugin
uses edge.capabilities.servicerequest.local.IServiceRequestPlugin
uses edge.capabilities.servicerequest.local.IServiceRequestRetrievalPlugin
uses edge.capabilities.servicerequest.local.IServiceRequestStatementRetrievalPlugin
uses edge.PlatformSupport.Bundle

class ServiceRequestHandler extends AbstractRpcHandler {

  /*
   * Retrieval plugins used by this handler.
   */
  private var _serviceRequestRetrievalPlugin : IServiceRequestRetrievalPlugin as ServiceRequestRetrievalPlugin
  private var _serviceRequestPlugin : IServiceRequestPlugin as ServiceRequestPlugin
  private var _serviceRequestCreationPlugin : IServiceRequestCreationPlugin as ServiceRequestCreationPlugin
  private var _serviceRequestQuotePlugin : IServiceRequestQuotePlugin as ServiceRequestQuotePlugin
  private var _serviceRequestInvoicePlugin : IServiceRequestInvoicePlugin as ServiceRequestInvoicePlugin
  private var _serviceRequestStatementRetrievalPlugin : IServiceRequestStatementRetrievalPlugin as ServiceRequestStatementDao
  private var _serviceRequestAuthorizer : Authorizer<ServiceRequest>
  private var _serviceRequestSummaryPlugin : IServiceRequestSummaryPlugin as ServiceRequestSummaryPlugin
  private static var _serviceRequestApi = new ServiceRequestAPI()

  @InjectableNode
  @Param("serviceRequestRetrievalPlugin", "Plugin used to retrieve service requests.")
  @Param("serviceRequestPlugin", "Plugin used to modify service requests.")
  @Param("serviceRequestCreationPlugin", "Plugin used to create service requests for testing purposes.")
  @Param("serviceRequestQuotePlugin", "Plugin used to map quotes.")
  @Param("serviceRequestInvoicePlugin", "Plugin used to map invoices.")
  @Param("serviceRequestStatementRetrievalPlugin", "Plugin used to access service request statements (quotes/invoices)")
  @Param("serviceRequestSummaryPlugin", "Plugin used to create service request summaries")
  @Param("authzProvider", "Plugin used to access service request statements (quotes/invoices)")
  construct(
      serviceRequestRetrievalPlugin : IServiceRequestRetrievalPlugin,
      serviceRequestPlugin : IServiceRequestPlugin,
      serviceRequestCreationPlugin : IServiceRequestCreationPlugin,
      serviceRequestStatementRetrievalPlugin : IServiceRequestStatementRetrievalPlugin,
      serviceRequestQuotePlugin : IServiceRequestQuotePlugin,
      serviceRequestInvoicePlugin : IServiceRequestInvoicePlugin,
      serviceRequestSummaryPlugin : IServiceRequestSummaryPlugin,
      authzProvider:IAuthorizerProviderPlugin) {
    this._serviceRequestRetrievalPlugin = serviceRequestRetrievalPlugin
    this._serviceRequestPlugin = serviceRequestPlugin
    this._serviceRequestCreationPlugin = serviceRequestCreationPlugin
    this._serviceRequestQuotePlugin = serviceRequestQuotePlugin
    this._serviceRequestInvoicePlugin = serviceRequestInvoicePlugin
    this._serviceRequestStatementRetrievalPlugin = serviceRequestStatementRetrievalPlugin
    this._serviceRequestAuthorizer = authzProvider.authorizerFor(ServiceRequest)
    this._serviceRequestSummaryPlugin = serviceRequestSummaryPlugin
  }

  /**
   * Using the authentication criteria defined for vendors in the granted authorities, perform a query using the
   * ServiceRequestRetrievalPlugin. The matching requests are returned as an array of ServiceRequestSummaryDTOs.
   *
   * <dl>
   * <dt>Calls:</dt>
   * <dd><code>IServiceRequestRetrievalPlugin#getAllServiceRequestsForVendor()</code> - to retrieve the service requests.</dd>
   * </dl>
   *
   * @returns The service requests the user is authorised to view as a ServiceRequestSummaryDTO array. Returns null if no service requests are found.
   */
  @JsonRpcMethod
  public function getServiceRequestsForVendor() : ServiceRequestSummaryDTO[]{
    var serviceRequests = ServiceRequestRetrievalPlugin.getAllServiceRequestsForVendor()
    return ServiceRequestSummaryPlugin.mapSummaries(serviceRequests)
  }

  /**
   * Searches for a single service request based on the service request number given. Throws EntityNotFoundException if the SR is not found.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>IServiceRequestRetrievalPlugin#getServiceRequestByNumber(String)</code> - to retrieve the service request.</dd>
   *  <dd><code>IServiceRequestPlugin#toDto(ServiceRequest)</code> - to return the DTO.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestNumber The service request's unique number to search by
   * @returns The service request as a ServiceRequestDTO.
   */
  @JsonRpcMethod
  public function getServiceRequestDetails(serviceRequestNumber : String) : ServiceRequestDTO {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    return _serviceRequestPlugin.toDTO(serviceRequest)
  }

  /**
   * Searches for all messages belonging to a specific vendor.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#getMessagesForSpecialist(String)</code> - to obtain the message list.</dd>
   * </dl>
   *
   * @returns The service request messages for the vendor as an array of  ServiceRequestMessageDTOs.
   */
  @JsonRpcMethod
  public function getMessagesForSpecialist() : ServiceRequestGlobalMessagesDTO{
    var vendorIDs = _serviceRequestAuthorizer.UserProvider.EffectiveUser.getTargets(AuthorityType.VENDOR)
    var messages = new ArrayList<gw.webservice.cc.cc1000.vendormanagement.Message>()
    var messagesDTO = new ServiceRequestGlobalMessagesDTO() {
      :Truncated = false,
      :MaxAllowedMessages = CCConfigParameters.ServiceRequestAPIMaxMessageResults.Value
    }
    for (vendorID in vendorIDs){
      var messagesForSpecialistResults = _serviceRequestApi.getMessagesForSpecialist(vendorID)
      messages.addAll(messagesForSpecialistResults.Results)
      if (messagesForSpecialistResults.ResultsAreTruncated == true){
        messagesDTO.Truncated = true
      }
    }

    messagesDTO.Messages = messages.map(\x -> convertToMessageDTO(x)).toTypedArray()
    return messagesDTO
  }

  private static function convertToMessageDTO(message : gw.webservice.cc.cc1000.vendormanagement.Message) : ServiceRequestMessageDTO {
    var dto = new ServiceRequestMessageDTO();
    dto.ServiceRequestNumber = message.ServiceRequestReference.ServiceRequestNumber
    dto.Title = message.Title
    dto.Body = message.Body;
    dto.Author = message.Sender.Name
    dto.Type = message.Type
    dto.SendDate = message.Date
    dto.ReferenceNumber = message.ServiceRequestReference.ServiceRequestReferenceNumber != null ?
        message.ServiceRequestReference.ServiceRequestReferenceNumber : message.ServiceRequestReference.ClaimNumber
    return dto;
  }

  /**
   * Creates a new message for a single service request based on the service request number given and information contained in a message DTO.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#sendMessage(String, String, String, String, ServiceRequestMessageType)</code> - to create a new message.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestNumber The service request's unique number to search by
   * @param message The message to add, as a ServiceRequestMessageDTO
   *
   */
  @JsonRpcMethod
  public function createMessage(serviceRequestNumber : String, message : ServiceRequestMessageDTO) {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.sendMessage(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber, message.Title, message.Body, message.Type);
  }

  /**
   * Updates the reference number on a single service request based on the service request number given and a new reference number, and records a history item describing the change.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#sendMessageupdateServiceRequestReferenceNumber(String, String, String)</code> - to update the Reference.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestAction an action DTO containing the SR number and the referenceNumber (as description)
   *
   */
  @JsonRpcMethod
  public function updateReferenceNumber(serviceRequestAction : ServiceRequestActionDTO) {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestAction.ServiceRequestNumber)
    var originalReferenceNumber = serviceRequest.ServiceRequestReferenceNumberGw
    _serviceRequestApi.updateServiceRequestReferenceNumber(serviceRequest.Specialist.AddressBookUID, serviceRequestAction.ServiceRequestNumber, serviceRequestAction.Description)

    if (serviceRequestAction.Description != originalReferenceNumber) {
      Bundle.transaction(\ bundle -> {
        serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestAction.ServiceRequestNumber) //Refresh SR
        bundle.add(serviceRequest)
        var reasonForChange = TranslateUtil.translate("Web.ServiceRequest.StateTransition.ReferenceNumberChanged", {serviceRequest.ServiceRequestReferenceNumberGw})
        serviceRequest.recordChange(reasonForChange, null, null, serviceRequest.Specialist) //Add a history event to the effect that we updated the ref
      })
    }
  }

  /**
   * Adds or replaces a quote on a given service request using information contained in a quote DTO.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#addOrReplaceQuote(String, String, StatementCreationInstructions)</code> - to add/update the quote.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If the number of days to perform service on the quote is less than zero</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param publicID The service request's public ID to search by
   * @param quote The new quote information stored as a ServiceRequestQuoteDTO
   * @returns The service request quote as a ServiceRequestQuoteDTO.
   *
   */
  @JsonRpcMethod
  public function addOrReplaceQuote(publicID : String, quote : ServiceRequestQuoteDTO) : ServiceRequestQuoteDTO{
    var quoteTotalLineItem = new gw.webservice.cc.cc1000.vendormanagement.ServiceRequestStatementLineItem() {
      :Amount = quote.TotalAmount.toCurrencyAmount(),
      :Category = ServiceRequestStatementLineItemCategory.TC_OTHER
    }
    var statementCreationInstructions = new StatementCreationInstructions(){
      :LineItems = { quoteTotalLineItem },
      :Description = quote.Description,
      :ExistingDocumentsToLinkPublicIds = quote.ExistingDocumentsToLink.toList(),
      :QuoteNumberOfDaysToPerformService = quote.ExpectedDaysToPerformService,
      :ReferenceNumber = quote.ReferenceNumber
    }

    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestFromPublicId(publicID)
    var newQuoteId = _serviceRequestApi.addOrReplaceQuote(serviceRequest.Specialist.AddressBookUID, serviceRequest.ServiceRequestNumber, statementCreationInstructions)
    var newQuote = _serviceRequestStatementRetrievalPlugin.getServiceRequestStatementFromPublicId(newQuoteId) as ServiceRequestQuote
    return _serviceRequestQuotePlugin.toDTO(newQuote)
  }

  /**
   * Adds an invoice to a given service request.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#addInvoice(String, String, StatementCreationInstructions)</code> - to add an invoice.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>IllegalArgumentException</code> - If the service request ID is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request ID is non-unique</dd>
   * </dl>
   *
   * @param publicID The service request's public ID to search by
   * @param invoice The invoice information stored in a ServiceRequestInvoiceDTO
   * @returns The invoice as a ServiceRequestInvoiceDTO.
   *
   */
  @JsonRpcMethod
  public function addInvoice(publicID : String, invoice : ServiceRequestInvoiceDTO) : ServiceRequestInvoiceDTO {
    var invoiceTotalLineItem = new gw.webservice.cc.cc1000.vendormanagement.ServiceRequestStatementLineItem() {
      :Amount = invoice.TotalAmount.toCurrencyAmount(),
      :Category = ServiceRequestStatementLineItemCategory.TC_OTHER
    }
    var statementCreationInstructions = new StatementCreationInstructions() {
      :LineItems = { invoiceTotalLineItem },
      :Description = invoice.Description,
      :ReferenceNumber = invoice.ReferenceNumber,
      :ExistingDocumentsToLinkPublicIds = invoice.ExistingDocumentsToLink.toList()
    }

    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestFromPublicId(publicID)
    var newPublicId = _serviceRequestApi.addInvoiceToServiceRequest(serviceRequest.Specialist.AddressBookUID, serviceRequest.ServiceRequestNumber, statementCreationInstructions)
    var newInvoice = _serviceRequestStatementRetrievalPlugin.getServiceRequestStatementFromPublicId(newPublicId) as ServiceRequestInvoice
    return _serviceRequestInvoicePlugin.toDTO(newInvoice)
  }

  /**
   * Withdraws an invoice on a service request.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#withdrawInvoice(String, String, String, String)</code> - to withdraw the invoice.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request ID in the withdrawalDTO is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request ID in the withdrawalDTO is non-unique</dd>
   *  <dd><code>IllegalArgumentException</code> - If the invoice ID in the withdrawalDTO is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the invoice ID in the withdrawalDTO is non-unique</dd>
   * </dl>
   *
   * @param invoiceWithdrawal Withdrawal details stored as an InvoiceWithdrawalDTO
   * @returns True or false, depending on whether the operation was successful.
   */
  @JsonRpcMethod
  public function withdrawInvoice(invoiceWithdrawal : InvoiceWithdrawalDTO) : boolean {
    var invoice = _serviceRequestStatementRetrievalPlugin.getServiceRequestStatementFromPublicId(invoiceWithdrawal.InvoiceID) as ServiceRequestInvoice
    var serviceRequest = ServiceRequestEntity.getFromStatement(invoice)
    _serviceRequestApi.withdrawInvoice(serviceRequest.Specialist.AddressBookUID, serviceRequest.ServiceRequestNumber, invoice.PublicID, invoiceWithdrawal.Reason)
    var invoiceResult = serviceRequest.Invoices.where(\ i -> i.PublicID == invoiceWithdrawal.InvoiceID).single() //needs to be reloaded as old reference still thinks it's active
    return invoiceResult.Status == ServiceRequestInvoiceStatus.TC_WITHDRAWN
  }

  /**
   * Accepts work on a service request.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#acceptWork(String, String, Date)</code> - to accept and begin work on the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param acceptWorkDTO A DTO containing a service request number and date of acceptance.
   *
   */
  @JsonRpcMethod
  public function acceptWork(acceptWorkDTO : ServiceRequestAcceptWorkDTO) {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(acceptWorkDTO.ServiceRequestNumber)
    _serviceRequestApi.acceptWork(serviceRequest.Specialist.AddressBookUID, acceptWorkDTO.ServiceRequestNumber, acceptWorkDTO.CompletionDate)
  }

  /**
   * "Decline work" and "Cancel service request" are similar.
   * The difference is that "decline" is what a vendor does when they are first presented with the service instructions -
   * they have a choice to either accept or decline the work. Later, after the vendor has accepted the work
   * and they have started working on either the quote or the service,
   * they can cancel the service request.
   * In the end, however, the effect is very similar: the ServiceRequest.Progress is set to DECLINED in both cases.
   * The best reference for what these operations actually do and when they are available is probably the state handlers.
   * For example, <code>ServiceRequestQuoteAndServiceStateHandler</code>.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#declineWork(String, String, String)</code> - to stop work on the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestAction A DTO containing a service request number and reason for declining.
   */
  @JsonRpcMethod
  public function declineWork(serviceRequestAction : ServiceRequestActionDTO) {
    final var serviceRequestNumber = serviceRequestAction.ServiceRequestNumber
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.declineWork(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber, serviceRequestAction.Description)
  }

  /**
   * Cancels a service request.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#cancelServiceRequest(String, String, String)</code> - to cancel the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestAction A DTO containing a service request number and reason for cancelling.
   *
   */
  @JsonRpcMethod
  public function cancelServiceRequest(serviceRequestAction : ServiceRequestActionDTO) {
    final var serviceRequestNumber = serviceRequestAction.ServiceRequestNumber
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.cancelServiceRequest(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber, serviceRequestAction.Description)
  }

  /**
   * Creates a service request based on the claim number given. Throws JsonRpcSecurityException if EnableInternalDebugTools flag is disabled.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestCreationPlugin#createServiceRequest(String)</code> - to create SR.</dd>
   *  <dd><code>IServiceRequestPlugin#toDto(ServiceRequest)</code> - to return the DTO.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>JsonRpcSecurityException</code> - If EnableInternalDebugTools flag is disabled</dd>
   * </dl>
   *
   * @param claimNumber The claim's unique number to search by
   * @param serviceRequestKind possible values are quoteonly, serviceonly, quoteandservice
   * @returns The service request as a ServiceRequestDTO.
   */
  @JsonRpcMethod
  public function createServiceRequest(claimNumber : String, serviceRequestKind : ServiceRequestKind, submitInstruction : Boolean) : ServiceRequestDTO {
    if (!PLConfigParameters.EnableInternalDebugTools.getValue()) {
      throw new JsonRpcSecurityException()
    }
    return ServiceRequestCreationPlugin.createServiceRequest(claimNumber, serviceRequestKind, submitInstruction)
  }

  /**
   * Temporarily suspends a service request until further notice is given.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#recordWaiting(String, String, String)</code> - to delay the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   * @param serviceRequestAction A DTO containing a service request number and reason for blockage.
   *
   */
  @JsonRpcMethod
  public function reportBlocked(serviceRequestAction : ServiceRequestActionDTO) {
    final var serviceRequestNumber = serviceRequestAction.ServiceRequestNumber
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.recordWaiting(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber, serviceRequestAction.Description)
  }

  /**
   * After a service request is suspended, this function is used to resume work.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#recordWorkResumed(String, String)</code> - to resume the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestNumber A service request number.
   *
   */
  @JsonRpcMethod
  public function resumeWork(serviceRequestNumber : String) {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.recordWorkResumed(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber)
  }

  /**
   * Indicates work on a given service request has been completed.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#recordWorkCompleted(String, String)</code> - to finish the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestNumber A service request number.
   *
   */
  @JsonRpcMethod
  public function completeWork(serviceRequestNumber : String) {
    var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestNumber)
    _serviceRequestApi.recordWorkCompleted(serviceRequest.Specialist.AddressBookUID, serviceRequestNumber)
  }

  /**
   * Sets the expected completion date to a given date, to indicate that the vendor will be delayed in completing the work.
   *
   * <dl>
   *  <dt>Calls:</dt>
   *  <dd><code>ServiceRequestAPI#setExpectedCompletionDateAndRecordChange(Date, String, boolean, boolean, ServiceRequestStateHandler)</code> - to delay the service request.</dd>
   *  <dt>Throws:</dt>
   *  <dd><code>ServiceRequestOperationUnavailableException</code> - If the service request operation is not allowed in the current context</dd>
   *  <dd><code>IllegalArgumentException</code> - If the service request number is null or empty</dd>
   *  <dd><code>IllegalStateException</code> - If the service request number is non-unique</dd>
   * </dl>
   *
   * @param serviceRequestAction A DTO containing a service request number, new competion date and reason for delay.
   *
   */
  @JsonRpcMethod
  public function reportDelay(serviceRequestAction : ServiceRequestReportDelayDTO){
    Bundle.transaction(\ bundle -> {
      var serviceRequest = ServiceRequestRetrievalPlugin.getServiceRequestByNumber(serviceRequestAction.ServiceRequestNumber)
      var stateHandler = serviceRequest.createStateHandler()
      var isService = serviceRequest.expectedServiceCompletionDateApplies(stateHandler)

      bundle.add(serviceRequest)
      serviceRequest.setExpectedCompletionDateAndRecordChange(serviceRequestAction.NewCompletionDate.moveToEndOfDay(), serviceRequestAction.Reason, false, isService, stateHandler)
    })
  }
}
