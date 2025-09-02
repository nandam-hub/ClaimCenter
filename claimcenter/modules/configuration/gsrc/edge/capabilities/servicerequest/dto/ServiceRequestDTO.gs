package edge.capabilities.servicerequest.dto

uses edge.capabilities.claim.contact.dto.ClaimContactDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses java.math.BigDecimal
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.capabilities.servicerequest.statement.quote.dto.ServiceRequestQuoteDTO
uses edge.capabilities.servicerequest.message.dto.ServiceRequestMessageDTO
uses edge.capabilities.servicerequest.statement.invoice.dto.ServiceRequestInvoiceDTO
uses edge.capabilities.servicerequest.history.dto.ServiceRequestChangeDTO
uses edge.capabilities.currency.dto.AmountDTO

/**
* Used to transfer service request details for the service request details page.
 */
class ServiceRequestDTO {

  /** When the service request was initiated by the adjuster */
  @JsonProperty 
  var _requestDate : Date as RequestDate

  /** The owning claim's loss date */
  @JsonProperty
  var _lossDate : Date as LossDate

  @JsonProperty
  var _publicID : String as PublicID

  /** The service request number on the claim itself. */
  @JsonProperty
  var _serviceRequestNumber : String as ServiceRequestNumber

  /** The ID of the owning claim. */
  @JsonProperty
  var _claimID : String as ClaimID

  /** Contact details for the customer contact. */
  @JsonProperty 
  var _customerContact : ContactDTO as CustomerContact

  /** The adjuster's contact details */
  @JsonProperty
  var _claimHandler : ContactDTO as ClaimHandler

  /** The vendor's contact details */
  @JsonProperty
  var _vendor : ContactDTO as Vendor

  /** The customer claim contact details */
  @JsonProperty
  var _customerClaimContact : ClaimContactDTO as CustomerClaimContact

  /** A string description of the next action to be taken. */
  @JsonProperty 
  var _nextStep : String as NextStep

  /** Whether or not the next step is to be performed by the vendor or not. */
  @JsonProperty
  var _nextStepOwnerIsSpecialist : boolean as NextStepOwnerIsSpecialist

  /** Any additional instructions provided by the adjuster. */
  @JsonProperty
  var _additionalInstructions : String as AdditionalInstructions

  /** If this is true, ExpectedQuoteCompletionDate is used */
  @JsonProperty
  var _quoteDateApplies : boolean as QuoteDateApplies

  /**
   * Not all stages or service request types allow adding or revising quotes.
   * E.g. can't add a quote when the request is in "declined" state.
   */
  @JsonProperty
  var _vendorCanAddOrReviseStatement : boolean as VendorCanAddOrReviseStatement

  /** If this is true, ExpectedServiceCompletionDate is used */
  @JsonProperty
  var _serviceDateApplies : boolean as ServiceDateApplies

  /** The date the vendor expects the quote to be provided (ie quote only)*/
  @JsonProperty
  var _expectedQuoteCompletionDate : Date as ExpectedQuoteCompletionDate

  /** The date the vendor expects the service to be completed */
  @JsonProperty
  var _expectedServiceCompletionDate : Date as ExpectedServiceCompletionDate

  /** The type of service request (Quote only, Service only, Quote & Service) */
  @JsonProperty
  var _requestKind : typekey.ServiceRequestKind as RequestKind

  /** The most applicable action to take in the current context. */
  @JsonProperty
  var _defaultOperation: ServiceRequestOperation as DefaultOperation

  /** Any other operations that the vendor can take in the current context. */
  @JsonProperty
  var _otherOperations: List<ServiceRequestOperation> as OtherOperations

  /** The list of services provided. */
  @JsonProperty
  var _services : String[] as Services

  /** The location of where to perform the service */
  @JsonProperty
  var _serviceAddress : AddressDTO as ServiceAddress

  @JsonProperty
  var _latestQuote : ServiceRequestQuoteDTO as LatestQuote

  /** Either the claim number, or the vendor-specific ID for the service request.*/
  @JsonProperty
  var _referenceNumber : String as ReferenceNumber

  /** Messages sent to and from the vendor */
  @JsonProperty
  var _messages : ServiceRequestMessageDTO[] as Messages

  /** Any documents on the service request */
  @JsonProperty
  var _documents : ServiceRequestDocumentDTO[] as Documents

  /** All invoice statements on the service request */
  @JsonProperty
  var _invoices : ServiceRequestInvoiceDTO[] as Invoices

  /** The sum total of amounts to be paid */
  @JsonProperty
  var _outstandingInvoiceAmount : AmountDTO as OutstandingInvoiceAmount

  /** The sum of all payments made on this service request */
  @JsonProperty
  var _paymentsMadeAmount : AmountDTO as PaymentsMadeAmount

  /** The sum of rejected or otherwise withdrawn payments */
  @JsonProperty
  var _rejectedAndWithdrawn : AmountDTO as RejectedAndWithdrawn

  /** A list of events that have occurred over the lifespan of the service request */
  @JsonProperty
  var _history : ServiceRequestChangeDTO[] as History

  /** The current status of the service request */
  @JsonProperty
  var _status : typekey.ServiceRequestProgress as Status

  /** Whether or not the quote can be revised (i.e. a quote already exists) */
  @JsonProperty
  var _isReviseQuote : boolean as IsReviseQuote

  /** Whether or not an invoice can be added (i.e. if a quote has been provided and the SR is not quote only) */
  @JsonProperty
  var _canAddInvoice : boolean as CanAddInvoice

  /** Whether or not the vendor is able to cancel the service request */
  @JsonProperty
  var _canCancel : boolean as CanCancel

  /**  Whether or not the vendor is able to delay the service request */
  @JsonProperty
  var _canDelay : boolean as CanDelay

  /**  Whether or not the current date has exceeded the expected completion date */
  @JsonProperty
  var _isOverdue : boolean as IsOverdue
}
