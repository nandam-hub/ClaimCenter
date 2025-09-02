package edge.capabilities.servicerequest.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/** Used by several pages to perform various operations on the service request, like blocking/resuming work, delaying, etc. */
class ServiceRequestActionDTO {

  @JsonProperty
  @Required
  var _serviceRequestNumber : String as ServiceRequestNumber

  /** Usually used to provide a reason for an action having been taken (i.e. reason for cancellation). */
  @JsonProperty
  @Required
  var _description : String as Description

}
