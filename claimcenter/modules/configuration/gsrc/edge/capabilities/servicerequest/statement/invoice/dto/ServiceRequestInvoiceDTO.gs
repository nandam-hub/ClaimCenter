package edge.capabilities.servicerequest.statement.invoice.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.capabilities.servicerequest.statement.dto.ServiceRequestStatementDTO
uses edge.aspects.validation.annotations.Required
uses edge.el.Expr
uses edge.aspects.validation.Validation

class ServiceRequestInvoiceDTO extends ServiceRequestStatementDTO{

  /** The current status of the invoice (Approved, Withdrawn etc)*/
  @JsonProperty
  @Required(Expr.neq(Expr.getProperty("PublicID",Validation.PARENT), null))
  var _status : typekey.ServiceRequestInvoiceStatus as Status

  /** When the payment was made */
  @JsonProperty
  var _paymentDate : Date as PaymentDate

  /** Whether or not the invoice can be withdrawn */
  @JsonProperty
  var _canWithdraw : Boolean as CanWithdraw

  /** Documents associated with the invoice */
  @JsonProperty
  var _documents : ServiceRequestDocumentDTO[] as Documents
}
