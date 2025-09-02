package edge.capabilities.servicerequest.dto

uses java.util.Date
uses edge.jsonmapper.JsonProperty

/** A DTO used to represent history items detailing events in the SR lifecycle. */
class ServiceRequestChangeDTO {

  /** The time the event occurred */
  @JsonProperty
  var _timestamp : Date as Timestamp

  /** The point in the ordered list at which the event occurred */
  @JsonProperty
  var _sequence : int as Sequence

  /** What happened when the event occurred */
  @JsonProperty
  var _description : String as Description

  /** Who created the event */
  @JsonProperty
  var _initiator : String as Initiator
}
