package edge.capabilities.servicerequest.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FutureDate

/** Used by the Report Delay page to provide info as to why the SR is delayed and to provide a new date */
class ServiceRequestReportDelayDTO {

  @JsonProperty
  @Required
  var _serviceRequestNumber : String as ServiceRequestNumber

  @JsonProperty
  @Required
  var _reason : String as Reason

  @JsonProperty
  @Required
  @FutureDate
  var _newCompletionDate : Date as NewCompletionDate

}
