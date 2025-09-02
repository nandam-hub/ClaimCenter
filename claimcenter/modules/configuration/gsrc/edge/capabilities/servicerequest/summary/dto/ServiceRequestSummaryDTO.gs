package edge.capabilities.servicerequest.summary.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses gw.vendormanagement.servicerequeststate.ServiceRequestNextAction

/** This class is used by the service request landing page to provide at a glance information. */
class ServiceRequestSummaryDTO {

  /** The expected completion date of the service request */
  @JsonProperty 
  var _dueDate : Date as DueDate

  /** The unique ID of the service request*/
  @JsonProperty
  var _publicID : String as PublicID

  /** The ID of the service request on the claim */
  @JsonProperty
  var _serviceRequestNumber : String as ServiceRequestNumber

  /** The current status of the service request */
  @JsonProperty
  var _status : typekey.ServiceRequestProgress as Status

  /** The vendor specfic reference number of the SR, or if that is not provided, the claim number */
  @JsonProperty
  var _referenceNumber : String as ReferenceNumber

  /** The owning claim's ID */
  @JsonProperty
  var _claimID : String as ClaimID

  /** The customer the service is being performed for */
  @JsonProperty 
  var _customerContact : String as CustomerContact

  /** The next action to take on the service request */
  @JsonProperty 
  var _nextStep : String as NextStep

  /** The enum code for the next action to take */
  @JsonProperty
  var _nextStepCode : ServiceRequestNextAction as NextStepCode

  /** Whether or not the next action is to be performed by the vendor or the adjuster */
  @JsonProperty
  var _nextStepOwnerIsSpecialist : boolean as NextStepOwnerIsSpecialist

  @JsonProperty 
  var _phoneNumber : String as PhoneNumber

  /** If this is true, ExpectedQuoteCompletionDate is used */
  @JsonProperty
  var _quoteDateApplies : boolean as QuoteDateApplies

  /** If this is true, ExpectedServiceCompletionDate is used */
  @JsonProperty
  var _serviceDateApplies : boolean as ServiceDateApplies

  /** The kind of service request (Quote Only, Service Only, Quote & Service */
  @JsonProperty
  var _requestKind : typekey.ServiceRequestKind as RequestKind

  /** The most applicable next step to take */
  @JsonProperty
  var _defaultOperation: ServiceRequestOperation as DefaultOperation

  /** The list of services to be performed */
  @JsonProperty
  var _services : String[] as Services

  /** Whether or not the quote can be revised (i.e. if a quote exists) */
  @JsonProperty
  var _isReviseQuote : boolean as IsReviseQuote

  /** If the vendor can cancel the quote */
  @JsonProperty
  var _canCancel : boolean as CanCancel
}
