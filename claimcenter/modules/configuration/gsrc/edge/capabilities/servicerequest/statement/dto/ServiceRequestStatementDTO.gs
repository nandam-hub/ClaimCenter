package edge.capabilities.servicerequest.statement.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.servicerequest.document.dto.ServiceRequestDocumentDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Augment

/** Base class, extended by quotes and invoices */
abstract class ServiceRequestStatementDTO {

  /** The currency of the quote/invoice */
  @JsonProperty
  var _currency : typekey.Currency as Currency

  @JsonProperty
  var _publicID : String as PublicID

  /** Freeform text description field for the statement (i.e. what it pertains to) */
  @JsonProperty
  @Required
   var _description : String as Description

  @JsonProperty
  @Required
  @Augment({"Amount"}, {new Required()})
   var _totalAmount : AmountDTO as TotalAmount

  @JsonProperty
   var _creationDate : Date as CreationDate

  /* A reference number, that can be supplied by the vendor */
  @JsonProperty
   var _referenceNumber : String as ReferenceNumber

  /** Used when a statement is saved - a list of newly uploaded documents that is then linked to the statement */
  @JsonProperty
  var _existingDocumentsToLink : String[] as ExistingDocumentsToLink

  /** Documents that are already linked to the statement */
  @JsonProperty
  var _documents : ServiceRequestDocumentDTO[] as Documents
}
