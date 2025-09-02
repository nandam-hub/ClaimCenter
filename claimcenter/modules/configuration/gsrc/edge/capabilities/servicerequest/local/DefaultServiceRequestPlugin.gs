package edge.capabilities.servicerequest.local

uses edge.capabilities.address.IAddressPlugin
uses edge.capabilities.claim.contact.IClaimContactPlugin
uses edge.capabilities.servicerequest.message.IServiceRequestMessagePlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.servicerequest.dto.ServiceRequestDTO
uses edge.capabilities.servicerequest.document.IServiceRequestDocumentPlugin
uses edge.capabilities.servicerequest.statement.quote.IServiceRequestQuotePlugin
uses edge.capabilities.servicerequest.statement.invoice.IServiceRequestInvoicePlugin
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.servicerequest.history.IServiceRequestChangePlugin
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.Mapper
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestStateHandler
uses java.util.Date
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.servicerequest.local.IServiceRequestPlugin

class DefaultServiceRequestPlugin implements IServiceRequestPlugin {

  /**
   * Plugin to convert addresses.
   */
  private var _addressPlugin : IAddressPlugin
  private var _messagesPlugin : IServiceRequestMessagePlugin
  private var _documentsPlugin : IServiceRequestDocumentPlugin
  private var _quotePlugin : IServiceRequestQuotePlugin
  private var _invoicePlugin : IServiceRequestInvoicePlugin
  private var _historyPlugin : IServiceRequestChangePlugin
  private var _claimContactPlugin : IClaimContactPlugin
  private var _mapper : Mapper as Mapper

  @ForAllGwNodes
  @Param("addressPlugin", "Address conversion plugin")
  @Param("messagesPlugin", "SR Messages conversion plugin")
  @Param("documentsPlugin", "SR documents conversion plugin")
  @Param("quotePlugin", "SR quote conversion plugin")
  @Param("invoicePlugin", "SR invoice conversion plugin")
  construct(addressPlugin : IAddressPlugin, messagesPlugin : IServiceRequestMessagePlugin,
            documentsPlugin : IServiceRequestDocumentPlugin,
            quotePlugin : IServiceRequestQuotePlugin,
            invoicePlugin : IServiceRequestInvoicePlugin,
            historyPlugin : IServiceRequestChangePlugin,
            claimContactPlugin : IClaimContactPlugin,
            authzProvider : IAuthorizerProviderPlugin) {
    this._addressPlugin = addressPlugin
    this._messagesPlugin = messagesPlugin
    this._documentsPlugin = documentsPlugin
    this._quotePlugin = quotePlugin
    this._invoicePlugin = invoicePlugin
    this._historyPlugin = historyPlugin
    this._claimContactPlugin = claimContactPlugin
    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(sr: ServiceRequest): ServiceRequestDTO {
    final var dto = new ServiceRequestDTO()
    var stateHandler = sr.createStateHandler()
    dto.PublicID = sr.PublicID
    dto.ServiceRequestNumber = sr.ServiceRequestNumber
    dto.ClaimID = sr.OwningClaim.ClaimNumber
    dto.CustomerContact = contactToDTO(sr.Instruction.CustomerContactGw)
    dto.ClaimHandler = contactToDTO(sr.AssignedUser.Contact)

    dto.NextStep = sr.nextActionDefinition().NextAction.ActionName
    dto.IsReviseQuote = sr.nextActionDefinition().NextAction.ActionName == "ReviseQuote" || sr.QuoteStatus == ServiceRequestQuoteStatus.TC_WAITINGFORAPPROVAL
    dto.VendorCanAddOrReviseStatement = sr.CoreSR.operationAvailable(ServiceRequestOperation.TC_ADDQUOTE, false, stateHandler)
    // this should be NULL-safe because sr.Specialist is always not NULL
    dto.NextStepOwnerIsSpecialist = sr.Specialist.equals(sr.nextActionDefinition().ActionOwner)

    dto.RequestKind = sr.Kind
    dto.ServiceAddress = _addressPlugin.toDto(sr.Instruction.ServiceAddressGw)
    dto.AdditionalInstructions = sr.Instruction.InstructionTextGw
    dto.LossDate = sr.Claim.LossDate
    dto.RequestDate = sr.AssignmentDate
    if (sr.LatestQuote !== null){ //Empty when SR is new
      dto.LatestQuote = _quotePlugin.toDTO(sr.LatestQuote)
    }
    dto.ReferenceNumber = sr.ServiceRequestReferenceNumberGw
    dto.Messages = _messagesPlugin.mapMessages(sr.Messages)
    dto.Documents = _documentsPlugin.mapDocuments(sr.Documents.toTypedArray())
    dto.Invoices = _invoicePlugin.mapInvoices(sr.Invoices)
    dto.OutstandingInvoiceAmount = AmountDTO.fromCurrencyAmount(sr.OutstandingInvoicesAmount)
    dto.PaymentsMadeAmount = AmountDTO.fromCurrencyAmount(sr.ActiveChecksAmount)
    dto.RejectedAndWithdrawn = AmountDTO.fromCurrencyAmount(sr.RejectedAndWithdrawnInvoicesAmount)
    dto.History = _historyPlugin.mapHistory(sr.History)
    dto.Status = sr.Progress
    dto.CanCancel = !typekey.ServiceRequestProgress.TF_TERMINAL.TypeKeys.contains(sr.Progress)
    dto.CanAddInvoice = sr.CoreSR.operationAvailable(ServiceRequestOperation.TC_ADDINVOICE, false, stateHandler)
    setOperations(sr, dto, stateHandler)
    dto.Services = getServices(sr)
    setDueDate(sr,dto)
    dto.IsOverdue = isOverdue(sr)

    return dto
  }

  override function getServiceRequests(claim: Claim): ServiceRequestDTO[] {
    return Mapper.mapArray(claim.ServiceRequests, \ sr -> {
      final var dto = toDTO(sr)
      final var customerContact = claim.getClaimContact(sr.Instruction.CustomerContactGw)
      dto.Vendor = contactToDTO(sr.Specialist)
      dto.CustomerClaimContact = _claimContactPlugin.toDTO(customerContact)
      return dto
    })
  }

  protected function contactToDTO(contact : Contact) : ContactDTO {
    final var dto = new ContactDTO()
    dto.PublicID = contact.PublicID
    dto.Subtype = contact.Subtype.Code
    dto.DisplayName = contact.DisplayName
    if(contact typeis Person){
      dto.FirstName = contact.FirstName
      dto.LastName = contact.LastName
      dto.FirstNameKanji = contact.FirstNameKanji
      dto.LastNameKanji = contact.LastNameKanji
      dto.Prefix = contact.Prefix
      dto.Suffix = contact.Suffix
      dto.Particle = contact.Particle
      dto.MiddleName = contact.MiddleName
      dto.CellNumber = contact.CellPhone
      if (contact typeis PersonVendor) {
        dto.PrimaryContactName = contact.PrimaryContact.DisplayName
      }
    } else if (contact typeis CompanyVendor) {
      dto.PrimaryContactName = contact.PrimaryContact.DisplayName
    }

    dto.ContactName = contact.Name
    dto.PrimaryPhoneType = contact.PrimaryPhone
    dto.HomeNumber = contact.HomePhone
    dto.WorkNumber = contact.WorkPhone
    dto.FaxNumber = contact.FaxPhone
    dto.EmailAddress1 = contact.EmailAddress1
    dto.PrimaryAddress = _addressPlugin.toDto(contact.PrimaryAddress)
    return dto
  }

  private function setDueDate(sr : ServiceRequest, dto : ServiceRequestDTO){
    if (sr.expectedQuoteCompletionDateApplies()){
      dto.ExpectedQuoteCompletionDate = sr.ExpectedQuoteCompletionDateGw
      dto.QuoteDateApplies = true
    }
    if (sr.expectedServiceCompletionDateApplies()){
      dto.ExpectedServiceCompletionDate = sr.ExpectedServiceCompletionDateGw
      dto.ServiceDateApplies = true
    }
  }


  private function getServices(sr : ServiceRequest) : String[] {
    return sr.Instruction.OrderedServices
        .map(\service -> service.Service.DisplayName).toTypedArray()
  }


  private function setOperations(sr : ServiceRequest, dto : ServiceRequestDTO, stateHandler : ServiceRequestStateHandler){
    var nextActionDefaultOperation = sr.nextActionDefinition(stateHandler).DefaultOperation
    dto.DefaultOperation = sr.CoreSR.operationAvailable(nextActionDefaultOperation,true, stateHandler) ? nextActionDefaultOperation : null
    dto.OtherOperations = ServiceRequestOperation.getTypeKeys(false)
        .where(\ op -> op != dto.DefaultOperation and sr.CoreSR.operationAvailable(op,true, stateHandler)).toList()
    dto.OtherOperations.removeAll({ServiceRequestOperation.TC_UPDATEQUOTEECD, ServiceRequestOperation.TC_UPDATESERVICEECD})    //Not available operations on frontend as per 1.0
    dto.CanDelay = sr.expectedQuoteCompletionDateApplies(stateHandler) or sr.expectedServiceCompletionDateApplies(stateHandler)
  }


  /** Checks if service request is in "overdue" condition. */
  private function isOverdue(sr : ServiceRequest) : boolean {
    if (sr.Progress != typekey.ServiceRequestProgress.TC_INPROGRESS) {
      return false
    }

    return sr.nextExpectedCompletionDate() != null  &&  sr.nextExpectedCompletionDate() < Date.CurrentDate.trimToMidnight()
  }
}
