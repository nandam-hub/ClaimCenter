package edge.capabilities.servicerequest.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FutureDate

/** Used by the Accept Work page to perform said action */
class ServiceRequestAcceptWorkDTO {

  @JsonProperty
  @Required
  var _serviceRequestNumber : String as ServiceRequestNumber

  /** The expected completion date */
  @JsonProperty
  @Required
  @FutureDate
  var _completionDate : Date as CompletionDate

}
