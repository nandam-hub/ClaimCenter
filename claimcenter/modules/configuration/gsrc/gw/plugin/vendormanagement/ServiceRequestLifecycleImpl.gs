package gw.plugin.vendormanagement

uses com.google.common.base.Preconditions
uses gw.core.vendormanagement.IServiceRequestActivityPatternProvider
uses gw.api.financials.CurrencyAmount
uses gw.core.vendormanagement.ISpecialistServiceCodeProvider
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestOperationContext
uses gw.core.vendormanagement.servicerequeststate.ServiceRequestStateHandler
uses gw.entity.IEntityType
uses gw.vendormanagement.ServiceRequestActivityPatternProvider
uses gw.vendormanagement.SpecialistServiceCodeProvider
uses gw.vendormanagement.servicerequeststate.ServiceRequestQuoteAndServiceStateHandler
uses gw.vendormanagement.servicerequeststate.ServiceRequestQuoteOnlyStateHandler
uses gw.vendormanagement.servicerequeststate.ServiceRequestServiceOnlyStateHandler
uses gw.vendormanagement.servicerequeststate.ServiceRequestUnmanagedStateHandler
uses gw.api.assignment.AutoAssignAssignee
uses gw.api.locale.DisplayKey

uses javax.annotation.Nullable

@Export
class ServiceRequestLifecycleImpl implements IServiceRequestLifecycle {
  /**
   * @return new implementation instance corresponding to ServiceRequestKind
   */
  override function createStateHandler(kind : ServiceRequestKind) : ServiceRequestStateHandler {
    switch (kind) {
      case TC_QUOTEANDSERVICE:
        return new ServiceRequestQuoteAndServiceStateHandler()
      case TC_QUOTEONLY:
        return new ServiceRequestQuoteOnlyStateHandler()
      case TC_SERVICEONLY:
        return new ServiceRequestServiceOnlyStateHandler()
      case TC_UNMANAGED:
        return new ServiceRequestUnmanagedStateHandler()
    }
    return null
  }

  /**
   * Use this method to set additional fields to ServiceRequest.
   */
  override function initializeServiceRequest(serviceRequest : ServiceRequest) {
  }

  override function finishServiceRequestSetup(serviceRequest : ServiceRequest, isSpecialist : boolean) {
    serviceRequest.Currency = serviceRequest.Specialist.PreferredCurrency ?: serviceRequest.Claim.Currency

    if (serviceRequest.ExposureGw != null && serviceRequest.IncidentGw == null) {
      serviceRequest.IncidentGw = serviceRequest.ExposureGw.Incident
    }

    if (serviceRequest.ServiceRequestNumber == null) {
      serviceRequest.assignServiceRequestNumber()
    }

    if (serviceRequest.SpecialistCommMethodGw == null) {
      serviceRequest.initializeCommMethod()
    }

    var stateHandler = serviceRequest.createStateHandler()
    serviceRequest.Progress = stateHandler.InitialProgressState ?: ServiceRequestProgress.TC_DRAFT
    serviceRequest.QuoteStatus = stateHandler.InitialQuoteStatusState ?: ServiceRequestQuoteStatus.TC_NOQUOTE

    // Assign users and set roles when creating a Service Request outside the FNOL.
    // The ClaimState is DRAFT only when coming from the FNOL Wizard
    if (serviceRequest.Claim.State != ClaimState.TC_DRAFT) {
      serviceRequest.setExpectedServiceRequestRoles()
      AutoAssignAssignee.INSTANCE.assignToThis(serviceRequest) //Use the assignment rules
    }

    var initiator = isSpecialist ? serviceRequest.Specialist : User.util.CurrentUser.Contact
    serviceRequest.recordChange(DisplayKey.get("Web.ServiceRequest.StateTransition.Description.ServiceCreated"), null, null, initiator)
  }

  override function initializeServiceRequestQuote(srQuote : ServiceRequestQuote, @Nullable baseSrQuote : ServiceRequestQuote) {
    if (baseSrQuote == null) {
      // add fields to initialize on srQuote here
    } else {
      cloneServiceRequestQuote(srQuote, baseSrQuote)
    }
  }

  private function cloneServiceRequestQuote(srQuote : ServiceRequestQuote, baseSrQuote : ServiceRequestQuote) {
    if (srQuote.ServiceRequest != baseSrQuote.ServiceRequest) {
      throw new RuntimeException("Attempt to clone a ServiceRequestQuote that is not on this ServiceRequest.")
    }

    // Copy quote properties from baseSrQuote onto srQuote for revision
    srQuote.Description = baseSrQuote.Description
    for (oldDocLink in baseSrQuote.StatementDocumentLinks) {
      var linkedDoc = oldDocLink.ServiceRequestDocumentLink.LinkedDocument
      if (linkedDoc != null) { // usually null from failing permission checks
        srQuote.linkDocument(linkedDoc)
      }
    }
    for (oldLineItem in baseSrQuote.LineItems) {
      var oldAmount = oldLineItem.Amount
      var newAmount = new CurrencyAmount(oldAmount.Amount, oldAmount.Currency)
      var newLineItem = new ServiceRequestStatementLineItem() {
        :ServiceRequestStatement = srQuote,
        :Amount = newAmount,
        :Category = oldLineItem.Category,
        :Description = oldLineItem.Description
      }
      srQuote.addToLineItems(newLineItem)
    }
  }

  override function finishQuoteSetup(context : ServiceRequestOperationContext, isSpecialist : boolean) {
    var quote = context.Statement
    Preconditions.checkArgument(quote != null, "ServiceRequestOperationContext.Statement must be set to a non null value");
    Preconditions.checkArgument(quote typeis ServiceRequestQuote, "ServiceRequestOperationContext.Statement must be of type ServiceRequestQuote but got " + quote.IntrinsicType.Name);
    context.Statement.ServiceRequest.CoreSR.performOperation(TC_ADDQUOTE, context, isSpecialist)
    context.Statement.ServiceRequest.onQuoteAdded()
  }

  override function initializeServiceRequestInvoice(serviceRequestInvoice : ServiceRequestInvoice) {
  }

  override function finishInvoiceSetup(context : ServiceRequestOperationContext, isSpecialist : boolean) {
    var invoice = context.Statement
    Preconditions.checkArgument(invoice != null, "ServiceRequestOperationContext.Statement must be set to a non null value");
    Preconditions.checkArgument(invoice typeis ServiceRequestInvoice, "ServiceRequestOperationContext.Statement must be of type ServiceRequestInvoice but got " + invoice.IntrinsicType.Name);
    var stateHandler = invoice.ServiceRequest.createStateHandler()
    (invoice as ServiceRequestInvoice).Status = stateHandler.InitialInvoiceStatusState ?: ServiceRequestInvoiceStatus.TC_WAITINGFORAPPROVAL
    invoice.ServiceRequest.CoreSR.performOperation(TC_ADDINVOICE, context, isSpecialist)
  }

  /**
   * @return A provider that gives access to the ServiceRequestActivityPattern objects.
   */
  override property get ServiceRequestActivityPatterns() : IServiceRequestActivityPatternProvider {
    return ServiceRequestActivityPatternProvider.INSTANCE
  }

  override property get SpecialistServiceCodes() : ISpecialistServiceCodeProvider {
    return SpecialistServiceCodeProvider.INSTANCE
  }

  override function initializeServiceRequestForPromotion(newServiceRequest : ServiceRequest, baseServiceRequest : ServiceRequest) {
    newServiceRequest.OriginatingServiceRequest = baseServiceRequest
    newServiceRequest.Currency = baseServiceRequest.Currency
    newServiceRequest.Specialist = baseServiceRequest.Specialist

    newServiceRequest.SpecialistCommMethodGw = baseServiceRequest.SpecialistCommMethodGw
    newServiceRequest.RequestedQuoteCompletionDateGw = baseServiceRequest.RequestedQuoteCompletionDateGw
    newServiceRequest.ExpectedQuoteCompletionDateGw = baseServiceRequest.ExpectedQuoteCompletionDateGw

    //  Copy current instruction information to the new instruction
    var oldInstruction = baseServiceRequest.Instruction
    var newInstruction = newServiceRequest.Instruction
    newInstruction.InstructionTextGw = oldInstruction.InstructionTextGw
    newInstruction.ServiceAddressGw = oldInstruction.ServiceAddressGw

    for (s in oldInstruction.Services) {
      // Only add compatible service types
      if (s.isCompatibleWithKind(newServiceRequest.Kind)) {
        var newService = new ServiceRequestInstructionService()
        newService.Service = s.Service
        newInstruction.addToServices(newService)
      }
    }

    // Copy all quotes
    var quotesMap : Map<ServiceRequestQuote, ServiceRequestQuote> = {} // represents the mapping between original quote and new quote
    for (quote in baseServiceRequest.Quotes) {
      var newQuote = new ServiceRequestQuote(newServiceRequest.Bundle) {
        :Description                  = quote.Description,
        :ExpectedDaysToPerformService = quote.ExpectedDaysToPerformService,
        :ReferenceNumber              = quote.ReferenceNumber,
        :ServiceRequest               = newServiceRequest,
        :StatementCreationTime        = quote.StatementCreationTime
      }
      for (oldLineItem in quote.LineItems) {
        var newLineItem = new ServiceRequestStatementLineItem(newQuote.Bundle) {
          :ServiceRequestStatement = newQuote,
          :Amount                  = oldLineItem.Amount,
          :Description             = oldLineItem.Description,
          :Category                = oldLineItem.Category
        }
      }
      if (quote == baseServiceRequest.LatestQuote) {
        newServiceRequest.LatestQuote = newQuote
      }
      for (oldStmtDocLink in quote.StatementDocumentLinks) {
        var quoteDocument = oldStmtDocLink.ServiceRequestDocumentLink.LinkedDocument
        newQuote.linkDocument(quoteDocument)
      }
      quotesMap.put(quote, newQuote)
    }

    // Add the CCAssignable properties
    for (prop in (CCAssignable.Type as IEntityType).EntityProperties) {
      if (not prop.Autogenerated) {
        var propInternal = (typeof newServiceRequest).TypeInfo.getProperty(prop.Name)
        propInternal.Accessor.setValue(newServiceRequest, prop.Accessor.getValue(baseServiceRequest))
      }
    }

    // Link documents to the Service Request and quote
    for (oldDocLink in baseServiceRequest.DocumentLinks) {
      var newDocLink = newServiceRequest.linkDocument(oldDocLink.LinkedDocument)
      newDocLink.VisibleToSpecialist = oldDocLink.VisibleToSpecialist
      newDocLink.DateSpecialistNotified = oldDocLink.DateSpecialistNotified
    }

    // Copy messages
    for (message in baseServiceRequest.Messages) {
      var newMessage = new ServiceRequestMessage() {
        :Title = message.Title,
        :Author = message.Author,
        :Type = message.Type,
        :Body = message.Body,
        :SendDate = message.SendDate,
        :SentFromPortal = message.SentFromPortal
      }
      newServiceRequest.addToMessages(newMessage)
    }

    // Copy the history of originating Service Request to the new Service
    baseServiceRequest.copyHistoryAndInstructionsToNewServiceRequest(newServiceRequest, quotesMap)
  }

  override function finishSetupForPromotedServiceRequest(serviceRequest : ServiceRequest, isSpecialist : boolean) {
    // Validate the instruction service types
    serviceRequest.Instruction.verifyServiceTypes()
    
    serviceRequest.assignServiceRequestNumber()
    serviceRequest.ExpectedServiceCompletionDateGw = serviceRequest.RequestedServiceCompletionDateGw
    serviceRequest.Progress = ServiceRequestProgress.TC_REQUESTED
    serviceRequest.QuoteStatus = ServiceRequestQuoteStatus.TC_APPROVED

    var initiator = isSpecialist ? serviceRequest.Specialist : User.util.CurrentUser.Contact

    // Record a change to the promotion and the originating service request to reflect promotion
    serviceRequest.recordChange(
        DisplayKey.get("Web.ServiceRequest.StateTransition.Description.ServiceRequestPromotedFrom",
            serviceRequest.OriginatingServiceRequest.ServiceRequestNumber),
        null,
        null,
        initiator)
    serviceRequest.OriginatingServiceRequest.recordChange(
        DisplayKey.get("Web.ServiceRequest.StateTransition.Description.ServiceRequestPromoted"),
        null,
        null,
        initiator)
  }
  
}