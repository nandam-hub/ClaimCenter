package gw.api.databuilder

uses gw.api.databuilder.populator.AbstractBeanPopulator
uses gw.api.domain.BeanUtil
uses gw.api.locale.DisplayKey
uses gw.api.util.CurrencyUtil
uses gw.lang.reflect.IType
uses gw.sampledata.SampleSpecialistServicesBase

uses java.util.Date

@Export
class ServiceRequestBuilder extends CCDataBuilder<ServiceRequest, ServiceRequestBuilder> {

  private static final var SERVICE_REQUEST_UNIQUE_NUMBER_GENERATOR = new ValueGenerator() {
    override function create(context : BuilderContext) : Object {
      return Long.toString(BeanUtil.generateNextId(ServiceRequest.TYPE.get()))
    }

    override property get ValueType() : IType {
      return String.Type
    }
  }
  private static final var SERVICE_REQUEST_NUMBER_GENERATOR = SequentialStringGenerator.withPrefix("", 1000)
  // populate the ServiceRequestChange very late, since it will be created using other values from the ServiceRequest
  private static final var SERVICE_REQUEST_CHANGE_ORDER = 10000
  // populate LatestChangeTimestampDenorm after ServiceRequestChange, since we want to override the value automatically
  // set when the change is recorded
  private static final var LATEST_CHANGE_DATE_ORDER = 10001

  // ------------------------------------------------------------- Constructors

  /**
   * Creates a new ServiceRequestBuilder with:
   * <ul>
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> Progress - Draft
   * <li> QuoteStatus - No Quote
   * <li> Instruction - a basic ServiceRequestInstruction
   * <li> Kind - Quote and Service
   * </ul>
   */
  construct() {
    super(ServiceRequest)
    set(ServiceRequest#ServiceRequestNumber,SERVICE_REQUEST_NUMBER_GENERATOR)
    set(ServiceRequest#Currency,CurrencyUtil.getDefaultCurrency())
    set(ServiceRequest#Progress,ServiceRequestProgress.TC_DRAFT)
    set(ServiceRequest#QuoteStatus,ServiceRequestQuoteStatus.TC_NOQUOTE)
    withInstruction(new ServiceRequestInstructionBuilder())
    set(ServiceRequest#Specialist, CompanyBuilder.uiReadyCompany())
    addPopulator(SERVICE_REQUEST_CHANGE_ORDER, \ bean -> {
      var serviceRequest = bean as ServiceRequest
      serviceRequest.recordChange(DisplayKey.get("Web.ServiceRequest.StateTransition.Description.ServiceCreated"), null, null, User.util.CurrentUser.Contact)
    })
    set(ServiceRequest#Kind,ServiceRequestKind.TC_QUOTEANDSERVICE)
  }

  // ----------------------------------------------------------- Methods

  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new auto claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with two services (auto body repair and auto audio equipment repair)
   *                    and a service address
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> Progress - Draft
   * <li> QuoteStatus - No Quote
   * <li> RequestedQuoteCompletionDate - tomorrow
   * <li> Specialist - a ui ready auto repair shop
   * <li> Kind - Quote and Service 
   * </ul>
   */
  static function uiReady() : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
          .onClaim(CCBuilderUtil.EXISTING_OR_NEW_AUTO_CLAIM)
          .withRequestedQuoteCompletionDateGw(Date.Tomorrow)
          .withInstruction(new ServiceRequestInstructionBuilder()
                    .withSpecialistService(SampleSpecialistServicesBase.AutoRepairAudio)
                    .withSpecialistService(SampleSpecialistServicesBase.AutoRepairBody)
                    .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
          .withSpecialist(CompanyBuilder.uiReadyCompanyOfType(AutoRepairShop))
  }

  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new auto claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with the service specified
   *                    and a service address
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> Progress - Draft
   * <li> QuoteStatus - No Quote
   * <li> RequestedQuoteCompletionDate - tomorrow
   * <li> Specialist - a ui ready auto repair shop
   * <li> Kind - Quote and Service 
   * </ul>
   */
  static function uiReady(service : SpecialistService) : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
          .onClaim(CCBuilderUtil.EXISTING_OR_NEW_AUTO_CLAIM)
          .withRequestedQuoteCompletionDateGw(Date.Tomorrow)
          .withInstruction(new ServiceRequestInstructionBuilder()
                    .withSpecialistService(service)
                    .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
          .withSpecialist(CompanyBuilder.uiReadyCompany())
  }

  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new auto claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with a single Service (auto repair body)
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> Progress - Draft
   * <li> QuoteStatus - No Quote
   * <li> RequestedQuoteCompletionDate - tomorrow
   * <li> Specialist - a ui ready auto repair shop
   * <li> Kind - Quote and Service 
   * </ul>
   */
  static function uiReadyAutoRepair() : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
      .onClaim(CCBuilderUtil.EXISTING_OR_NEW_AUTO_CLAIM)
      .withRequestedQuoteCompletionDateGw(Date.Tomorrow)
      .withInstruction(new ServiceRequestInstructionBuilder()
                .withSpecialistService(SampleSpecialistServicesBase.AutoRepairBody)
                .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
      .withSpecialist(CompanyBuilder.uiReadyCompanyOfType(AutoRepairShop))
  }  

  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new WC claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with a single Service (medical care)
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> Progress - Draft
   * <li> QuoteStatus - No Quote
   * <li> RequestedQuoteCompletionDate - tomorrow
   * <li> Specialist - a Doctor
   * <li> Kind - Quote and Service
   * </ul>
   */
  static function uiReadyWC() : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
      .onClaim(CCBuilderUtil.EXISTING_OR_NEW_WORKERS_COMP_CLAIM)
      .withRequestedQuoteCompletionDateGw(Date.Tomorrow)
      .withInstruction(new ServiceRequestInstructionBuilder()
                .withSpecialistService(SampleSpecialistServicesBase.MedicalCare)
                .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
      .withSpecialist(CompanyBuilder.uiReadyCompanyOfType(MedicalCareOrg))
  }

  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new auto claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with a single Service (auto rental)
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> ServiceRequestProgress - Draft
   * <li> QuoteStatus - null
   * <li> RequestedServiceCompletionDate - tomorrow
   * <li> Specialist - a ui ready company
   * <li> Kind - Service Only
   * </ul>
   */
  static function uiReadyServiceOnly() : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
      .onClaim(CCBuilderUtil.EXISTING_OR_NEW_AUTO_CLAIM)
      .withRequestedServiceCompletionDateGw(Date.Tomorrow)
      .withInstruction(new ServiceRequestInstructionBuilder()
                .withSpecialistService(SampleSpecialistServicesBase.AutoOtherRental)
                .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
      .withKind(TC_SERVICEONLY)
      .withSpecialist(CompanyBuilder.uiReadyCompany())
      .withRequestedServiceCompletionDateGw(Date.Today.addBusinessDays(5))
  }
  
  /**
   * Returns a builder to construct a UI ready ServiceRequest. The following fields are set:
   * <ul>
   * <li> Claim - Creates a new auto claim if the claim to use is not otherwise apparent
   * <li> Instruction - a new ServiceRequestInstruction with a single Service (auto appraisal)
   * <li> ServiceRequestNumber - a generated number
   * <li> Currency - the default currency
   * <li> ServiceRequestProgress - Draft
   * <li> QuoteStatus - null
   * <li> RequestedQuoteCompletionDate - tomorrow
   * <li> Specialist - a ui ready company
   * <li> Kind - Quote Only
   * </ul>
   */  
  static function uiReadyQuoteOnly() : ServiceRequestBuilder {
    return new ServiceRequestBuilder()
      .onClaim(CCBuilderUtil.EXISTING_OR_NEW_AUTO_CLAIM)
      .withRequestedQuoteCompletionDateGw(Date.Tomorrow)
      .withInstruction(new ServiceRequestInstructionBuilder()
                .withSpecialistService(SampleSpecialistServicesBase.AutoAppraise)
                .withServiceAddressGw(AddressBuilder.uiReadyUSA()))
      .withKind(TC_QUOTEONLY)
      .withSpecialist(CompanyBuilder.uiReadyCompany())
      .withRequestedQuoteCompletionDateGw(Date.Today.addBusinessDays(3))
  }

  /**
   * Sets the related claim.
   * @param claim the desired value
   * @return the modified builder
   */
  function onClaim(claim : Claim) : ServiceRequestBuilder {
    return onClaim(wrapBean<Claim>(claim))
  }

  /**
   * Sets the related claim.
   * @param claim a value generator that will return the desired value
   * @return the modified builder
   */
  function onClaim(claim : ValueGenerator< Claim >) : ServiceRequestBuilder {
    set(ServiceRequest#Claim, claim)
    return this
  }

  /**
   * Sets the incident that led to the work requested by this service request.
   * @param incident the desired value
   * @return the modified builder
   */
  function onIncidentGw(incident : Incident) : ServiceRequestBuilder {
    return onIncidentGw(wrapBean<Incident>(incident))
  }

  /**
   * Sets the incident that led to the work requested by this service request.
   * @param incident a value generator that will return the desired value
   * @return the modified builder
   */
  function onIncidentGw(incident : ValueGenerator<Incident>) : ServiceRequestBuilder {
    set(ServiceRequest#IncidentGw, incident)
    return this
  }

  /**
   * Add a service request instruction to the serviceRequest
   * @param instruction the service request instruction to add
   * @return the modified builder
   */
  function withInstruction(instruction : ServiceRequestInstruction) : ServiceRequestBuilder {
    return withInstruction(wrapBean<ServiceRequestInstruction>(instruction))
  }

  /**
   * Add a service request instruction to the serviceRequest
   * @param instruction a value generator that will return the service request instruction to add
   * @return the modified builder
   */
  final function withInstruction(instruction : ValueGenerator< ServiceRequestInstruction >) : ServiceRequestBuilder {
    addPopulator(ServiceRequest#Instruction, new AbstractBeanPopulator<ServiceRequest>({instruction}) {
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var instr = vals.single() as ServiceRequestInstruction
        serviceRequest.addToInstructionHistory(instr)
        serviceRequest.Instruction = instr
      }
    })
    return this
  }

  function withQuote(quote : ServiceRequestQuote) : ServiceRequestBuilder {
    return withQuote(wrapBean<ServiceRequestQuote>(quote))
  }

  function withQuote(quoteGenerator : ValueGenerator< ServiceRequestQuote >) : ServiceRequestBuilder {
    addArrayElement(ServiceRequest#Quotes, quoteGenerator)
    return this
  }

  /**
   * Add a service request quote to the serviceRequest
   * @param quote the service request quote to add
   * @return the modified builder
   */
  function withActiveQuote(quote : ServiceRequestQuote) : ServiceRequestBuilder {
    return withActiveQuote(wrapBean<ServiceRequestQuote>(quote))
  }

  /**
   * Add a service request quote to the serviceRequest
   * @param quote a value generator that will return the service request quote to add
   * @return the modified builder
   */
  function withActiveQuote(quote : ValueGenerator< ServiceRequestQuote >) : ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest>({quote}) {
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var serviceRequestQuote = vals.single() as ServiceRequestQuote
        serviceRequest.LatestQuote = serviceRequestQuote
        serviceRequestQuote.ServiceRequest = serviceRequest
      }
    })
    return this
  }

  function withInvoice(invoice : ServiceRequestInvoice) : ServiceRequestBuilder {
    return withInvoice(wrapBean<ServiceRequestInvoice>(invoice))
  }

  function withInvoice(invoiceGenerator : ValueGenerator< ServiceRequestInvoice >) : ServiceRequestBuilder {
    addArrayElement(ServiceRequest#Invoices, invoiceGenerator)
    return this
  }

  function withOriginatingServiceRequest(serviceRequest : ServiceRequest) : ServiceRequestBuilder {
    return withOriginatingServiceRequest(wrapBean<ServiceRequest>(serviceRequest))
      }

  function withOriginatingServiceRequest(serviceRequestGenerator : ValueGenerator< ServiceRequest >) : ServiceRequestBuilder {

    set(ServiceRequest#OriginatingServiceRequest, serviceRequestGenerator)
    return this
  }

  /**
   * Sets the vendor or internal entity selected to do the work requested by this service request; contains null until one is selected.
   * @param specialist the desired value
   * @return the modified builder
   */
  function withSpecialist(specialist : Contact) : ServiceRequestBuilder {
    return withSpecialist(wrapBean<Contact>(specialist))
  }

  /**
   * Sets the vendor or internal entity selected to do the work requested by this service request; contains null until one is selected.
   * @param specialist a value generator that will return the desired value
   * @return the modified builder
   */
  function withSpecialist(specialist : ValueGenerator< Contact >) : ServiceRequestBuilder {
    set(ServiceRequest#Specialist, specialist)
    return this
  }

  /**
   * Sets the channel through which the carrier will communicate with the specialist.
   * @param specialistCommMethod the desired value
   * @return the modified builder
   */
  function withSpecialistCommMethodGw(specialistCommMethod : SpecialistCommMethod) : ServiceRequestBuilder {
    set(ServiceRequest#SpecialistCommMethodGw, specialistCommMethod)
    return this
  }

  /**
   * Sets the current progress of this service request in its life cycle.
   * @param progress the desired value
   * @return the modified builder
   */
  function withProgress(progress : ServiceRequestProgress) : ServiceRequestBuilder {
    set(ServiceRequest#Progress, progress)
    return this
  }

  /**
   * Sets the current quote status of this service request in its life cycle.
   * @param quoteStatus the desired value
   * @return the modified builder
   */
  function withQuoteStatus(quoteStatus : ServiceRequestQuoteStatus) : ServiceRequestBuilder {
    set(ServiceRequest#QuoteStatus, quoteStatus)
    return this
  }

  /**
   * Sets the current kind of this service request in its life cycle.
   * @param kind the desired value
   * @return the modified builder
   */  
  function withKind(kind : ServiceRequestKind) : ServiceRequestBuilder {
    set(ServiceRequest#Kind, kind)
    return this
  }

  /**
   * Sets the date by which the specialist expects to complete the work.
   * @param expectedCompletionDate the desired value
   * @return the modified builder
   */
  function withExpectedServiceCompletionDateGw(expectedServiceCompletionDate : Date) : ServiceRequestBuilder {
    set(ServiceRequest#ExpectedServiceCompletionDateGw, expectedServiceCompletionDate)
    return this
  }
  
  /**
   * Sets the date by which the specialist expects to submit the quote.
   * @param expectedCompletionDate the desired value
   * @return the modified builder
   */
  function withExpectedQuoteCompletionDateGw(expectedQuoteCompletionDate : Date) : ServiceRequestBuilder {
    set(ServiceRequest#ExpectedQuoteCompletionDateGw, expectedQuoteCompletionDate)
    return this
  }

  /**
   * Sets the desired date by which the specialist will have completed the work.
   * @param requestedServiceCompletionDate the desired value
   * @return the modified builder
   */
  function withRequestedServiceCompletionDateGw(requestedServiceCompletionDate : Date) : ServiceRequestBuilder {
    set(ServiceRequest#RequestedServiceCompletionDateGw, requestedServiceCompletionDate)
    return this
  }
  
  /**
   * Sets the desired date for the by which the specialist will have submitted the quote.
   * @param requestedQuoteCompletionDate the desired value
   * @return the modified builder
   */
  function withRequestedQuoteCompletionDateGw(requestedQuoteCompletionDate : Date) : ServiceRequestBuilder {
    set(ServiceRequest#RequestedQuoteCompletionDateGw, requestedQuoteCompletionDate)
    return this
  }

  /**
   * Sets the globally-unique, user-readable identifier for this service request. This number is normally generated within ClaimCenter.
   * @param serviceRequestNumber the desired value
   * @return the modified builder
   */
  function withServiceRequestNumber(serviceRequestNumber : String) : ServiceRequestBuilder {
    set(ServiceRequest#ServiceRequestNumber, serviceRequestNumber)
    return this
  }

  public function withNonConflictingServiceRequestNumber() : ServiceRequestBuilder {
    set(ServiceRequest#ServiceRequestNumber, UniqueKeyGenerator.get().nextID())
    return this
  }

  /**
   * Sets the currency for this service request. The currency is used by statements on the service request.
   * @param currency the desired value
   * @return the modified builder
   */
  function withCurrency(currency : Currency) : ServiceRequestBuilder {
    set(ServiceRequest#Currency, currency)
    return this
  }

  /**
   * Sets the reference number that a specialist would normally assign to a service request.
   * @param refNumber the desired value
   * @return the modified builder
   */
  function withServiceRequestReferenceNumberGw(refNumber : String) : ServiceRequestBuilder {
    set(ServiceRequest#ServiceRequestReferenceNumberGw, refNumber)
    return this
  }

  /**
   * Adds the document to the service request
   * @param document to be linked to the service request
   * @return the modified builder
   */
  function withDocument(document : Document) : ServiceRequestBuilder {
    return withDocument(wrapBean<Document>(document))
  }
  
  /**
   * Add a document to the service request
   * @param document a value generator that will return the document to add
   * @return the modified builder
   */
  function withDocument(document : ValueGenerator < Document >): ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest> ({document}){
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        serviceRequest.linkDocument(vals.single() as Document)
      }
    })
    return this
  }

  /**
  * Adds the document to the service request
  * @param document a value generator that will return the document to add
  * @param shouldSend whether this document should be sent to the vendor
  * @return the modified builder
  */
  function withDocument(document : Document, shouldSend: boolean) : ServiceRequestBuilder {
    return withDocument(wrapBean<Document>(document), shouldSend)
  }
  
  /**
   * Add a document to the service request
   * @param document a value generator that will return the document to add
   * @param shouldSend whether this document should be sent to the vendor
   * @return the modified builder
   */
  function withDocument(document : ValueGenerator < Document >, shouldSend: boolean): ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest>({document}){
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var link = serviceRequest.linkDocument(vals.single() as Document)
        link.VisibleToSpecialist = shouldSend
      }
    })
    return this
  }  
  /**
   * Add an activity to the service request
   * @param activity to be linked to the service request
   * @return the modified builder
   */
  function withActivity(activity : Activity) : ServiceRequestBuilder {
    return withActivity(wrapBean<Activity>(activity))
  }

  /**
   * Add an activity to the service request
   * @param activity a value generator that will return the activity to add
   * @return the modified builder
   */
  function withActivity(activity : ValueGenerator< Activity >) : ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest> ({activity}){
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var activityObj = vals.single() as Activity
        activityObj.Claim = serviceRequest.Claim
        serviceRequest.addToActivities(activityObj)
      }
    })
    return this
  }
  
  /**
   * Add a note to the service request
   * @param note to add to the service request
   * @return the modified builder
   */
  function withNote(note : Note) : ServiceRequestBuilder {
    return withNote(wrapBean<Note>(note))
  }

  /**
   * Add a note to the service request
   * @param note a value generator that will return the document to add
   * @return the modified builder
   */
  function withNote(note : ValueGenerator< Note >) : ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest> ({note}){
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var noteObj = vals.single() as Note
        noteObj.Claim = serviceRequest.Claim
        serviceRequest.addToNotes(noteObj)
      }
    })
    return this
  }

  function withServiceRequestMessage(message:ValueGenerator< ServiceRequestMessage >) : ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest>({message}) {
      override function execute(bean : ServiceRequest, vals : Object[]) {
        var serviceRequest = bean
        var messageObj = vals.single() as ServiceRequestMessage
        messageObj.ServiceRequest = serviceRequest
        serviceRequest.addToMessages(messageObj)
      }
    })
    return this
  }

  /**
   * Set the assigned user and sets the group using one of that user's groups.
   * @param note  the user to assign to
   * @return the modified builder
   */
  function withAssignedUserAndDefaultGroup(user : User) : ServiceRequestBuilder {
    addPopulator(new AbstractBeanPopulator<ServiceRequest>({user}) {
      override function execute(serviceRequest : ServiceRequest, vals : Object[]) {
        serviceRequest.assignUserAndDefaultGroup(vals[0] as User)
      }
    })
    return this
  }

  /**
   * Overrides the value of LatestChangeTimestampDenorm.
   * NOTE: LatestChangeTimestampDenorm is normally set automatically when recording a ServiceRequestChange,
   * and this method will make the field inconsistent with the latest ServiceRequestChange.
   * @param date  the date to use
   * @return the modified builder
   */
  function withLatestChangeTimestampDenormOverridden(date : Date) : ServiceRequestBuilder {
    set(LATEST_CHANGE_DATE_ORDER, ServiceRequest#LatestChangeTimestampDenorm, date)
    return this
  }
  
  /**
   * Sets the tier of the service request
   * @param tier : ServiceRequestTier
   */
  function withTier(tier : ServiceRequestTier) : ServiceRequestBuilder {
    set(ServiceRequest#Tier, tier)
    return this
  }

  function withMessage(message : ServiceRequestMessage) : ServiceRequestBuilder {
    return withMessage(wrapBean<ServiceRequestMessage>(message))
  }

  function withMessage(message : ValueGenerator<ServiceRequestMessage>) : ServiceRequestBuilder {
    addArrayElement(ServiceRequest#Messages, message)
    return this
  }

  /**
   * Links the exposure of the service request
   * @param exposure the desired exposure to link
   */
  function withExposureGw(exposure : Exposure): ServiceRequestBuilder {
    return withExposureGw(wrapBean<Exposure>(exposure))
  }

  /**
   * Links the exposure of the service request
   * @param exposure a value generator that will return the exposure to link
   * @return the modified builder
   */
  function withExposureGw(exposure : ValueGenerator<Exposure>): ServiceRequestBuilder {
    set(ServiceRequest#ExposureGw, exposure)
    return this
  }
}
