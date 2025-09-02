package edge.capabilities.servicerequest.message.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

/** Represents all the service request messages related to the vendor, on all service requests they partake in */
class ServiceRequestGlobalMessagesDTO {

  /** All messages related to service requests the vendor partakes in */
  @JsonProperty
  var _messages : ServiceRequestMessageDTO[] as Messages

  /** Whether or not the list of messages was long enough to be capped */
  @JsonProperty
  var _truncated : Boolean as Truncated

  /** The maximum number of messages allowed before Truncated is set to true */
  @JsonProperty
  var _maxAllowedMessages : Integer as MaxAllowedMessages

}
