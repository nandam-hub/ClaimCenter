package edge.capabilities.servicerequest.statement

uses edge.capabilities.servicerequest.statement.dto.ServiceRequestStatementDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.servicerequest.document.IServiceRequestDocumentPlugin

class ServiceRequestStatementUtil {

  public static function fillStatementBaseFields(dto : ServiceRequestStatementDTO, srs: ServiceRequestStatement, docPlugin : IServiceRequestDocumentPlugin): ServiceRequestStatementDTO {
  dto.PublicID = srs.PublicID
  dto.Description = srs.Description
  dto.CreationDate = srs.StatementCreationTime
  dto.TotalAmount = AmountDTO.fromCurrencyAmount(srs.Amount)
  dto.ReferenceNumber = srs.ReferenceNumber
  dto.Documents = docPlugin.mapDocuments(srs.Documents.toTypedArray())
  dto.Currency = srs.ServiceRequestCurrency
  return dto
  }

}
