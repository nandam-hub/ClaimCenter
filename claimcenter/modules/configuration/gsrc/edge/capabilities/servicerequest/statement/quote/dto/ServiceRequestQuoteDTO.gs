package edge.capabilities.servicerequest.statement.quote.dto

uses edge.capabilities.servicerequest.statement.dto.ServiceRequestStatementDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Range
uses java.lang.Integer

class ServiceRequestQuoteDTO extends ServiceRequestStatementDTO{

  /** How long the vendor expects to take to perform the service */
  @JsonProperty
  @Required
  @Range(0,365)
  var _expectedDaysToPerformService : Integer as ExpectedDaysToPerformService

  /** The current status of the quote (Approved, waiting for approval, etc)*/
  @JsonProperty
  var _status : typekey.ServiceRequestQuoteStatus as Status

  /** Documents associated with the quote */
  @JsonProperty
  var _documents : ServiceRequestDocumentDTO[] as Documents
}
