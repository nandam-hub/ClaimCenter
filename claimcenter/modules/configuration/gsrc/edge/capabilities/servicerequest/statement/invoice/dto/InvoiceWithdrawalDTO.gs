package edge.capabilities.servicerequest.statement.invoice.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

class InvoiceWithdrawalDTO {

  @JsonProperty
  @Required
  var _reason : String as Reason

  @JsonProperty
  @Required
  var _invoiceId : String as InvoiceID
}
