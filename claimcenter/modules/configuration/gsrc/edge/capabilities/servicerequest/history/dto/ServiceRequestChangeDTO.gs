package edge.capabilities.servicerequest.history.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date

/** This class is used to represent the change history of a given service request.<br>
 * It details what change took place, when, and who initiated it.
*/
class ServiceRequestChangeDTO {

  /** When the event took place */
  @JsonProperty
  var _timestamp : Date as Timestamp

  /** The position in the ordered list of events */
  @JsonProperty
  var _sequence : int as Sequence

  /** What the event was about */
  @JsonProperty
  var _description : String as Description

  /** Who created the event */
  @JsonProperty
  var _initiator : String as Initiator
}
