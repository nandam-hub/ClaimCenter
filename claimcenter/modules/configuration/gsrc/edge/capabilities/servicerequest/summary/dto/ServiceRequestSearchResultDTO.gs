package edge.capabilities.servicerequest.summary.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

/**
 * A wrapper object returned from a service request endpoint with pagination enabled
 * returns the max number of results available from the query that was used and a subset of those results in DTO form
 */
class ServiceRequestSearchResultDTO {

  @JsonProperty
  var _maxNumberOfResults : Integer as MaxNumberOfResults

  @JsonProperty
  var _serviceRequests : ServiceRequestSummaryDTO[] as ServiceRequests
}
