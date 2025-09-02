package edge.capabilities.servicerequest.message.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Range
uses edge.aspects.validation.annotations.Size

/** Represents a message on the service request. */
class ServiceRequestMessageDTO {

  @JsonProperty
  var _publicID : String as PublicID

  /** The message text */
  @JsonProperty
  @Required
  @Size(0,1333)
  var _body : String as Body

  /** The subject of the message */
  @JsonProperty
  @Required
  var _title : String as Title

  /** Who created the message */
  @JsonProperty
  @Required(Expr.neq(Expr.getProperty("PublicID",Validation.PARENT), null))
  var _author : String as Author

  @JsonProperty
  @Required
  var _sendDate: Date as SendDate

  /** Whether or not the message is for information, or a question */
  @JsonProperty
  @Required
  var _type : typekey.ServiceRequestMessageType as Type

  /** The owning service request's number */
  @JsonProperty
  var _serviceRequestNumber : String as ServiceRequestNumber

  /** For global message tab. If SR does not have a refnum, use claim number */
  @JsonProperty
  var _referenceNumber : String as ReferenceNumber

}
