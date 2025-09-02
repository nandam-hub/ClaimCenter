package edge.capabilities.servicerequest.statement.quote

uses java.util.ArrayList
uses edge.capabilities.servicerequest.statement.quote.dto.ServiceRequestQuoteDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.servicerequest.document.IServiceRequestDocumentPlugin
uses edge.capabilities.servicerequest.statement.ServiceRequestStatementUtil

class DefaultServiceRequestQuotePlugin implements IServiceRequestQuotePlugin {

  private var _documentsPlugin : IServiceRequestDocumentPlugin

  @ForAllGwNodes
  @Param("documents", "SR Messages conversion plugin")
  construct(documentsPlugin : IServiceRequestDocumentPlugin) {
    this._documentsPlugin = documentsPlugin
  }

  override function toDTO(srq: ServiceRequestQuote): ServiceRequestQuoteDTO {
    final var dto = new ServiceRequestQuoteDTO()
    ServiceRequestStatementUtil.fillStatementBaseFields(dto, srq, _documentsPlugin)
    dto.ExpectedDaysToPerformService = srq.ExpectedDaysToPerformService
    dto.Status = srq.ServiceRequest.QuoteStatus

    return dto
  }

}
