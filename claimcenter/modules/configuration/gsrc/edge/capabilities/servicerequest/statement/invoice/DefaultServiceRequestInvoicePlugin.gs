package edge.capabilities.servicerequest.statement.invoice

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.servicerequest.document.IServiceRequestDocumentPlugin
uses edge.capabilities.servicerequest.statement.invoice.dto.ServiceRequestInvoiceDTO
uses edge.capabilities.servicerequest.statement.ServiceRequestStatementUtil
uses edge.util.mapping.Mapper
uses edge.security.authorization.IAuthorizerProviderPlugin

class DefaultServiceRequestInvoicePlugin implements IServiceRequestInvoicePlugin {

  private var _documentsPlugin : IServiceRequestDocumentPlugin
  private var _mapper : Mapper as readonly Mapper

  @ForAllGwNodes
  @Param("documents", "SR Messages conversion plugin")
  construct(documentsPlugin : IServiceRequestDocumentPlugin, authzProvider:IAuthorizerProviderPlugin) {
    this._documentsPlugin = documentsPlugin
    this._mapper = new Mapper(authzProvider)
  }

  override function toDTO(srq: ServiceRequestInvoice): ServiceRequestInvoiceDTO {
    return Mapper.mapRef(srq, \i -> toDTOImpl(srq))
  }

  override function mapInvoices(sris: ServiceRequestInvoice[]): ServiceRequestInvoiceDTO[] {
    return Mapper.mapArray(sris,\ i -> toDTO(i))
  }


  /** Converts invoice into DTO <em>without</em> checking entity access. */
  protected function toDTOImpl(srq: ServiceRequestInvoice) : ServiceRequestInvoiceDTO {
    final var dto = new ServiceRequestInvoiceDTO()
    ServiceRequestStatementUtil.fillStatementBaseFields(dto, srq, _documentsPlugin)
    dto.Status = srq.Status
    dto.PaymentDate = srq.PaymentDate
    dto.CanWithdraw = srq.CoreSR.operationAvailable(ServiceRequestOperation.TC_WITHDRAWINVOICE, true)

    return dto
  }
}
