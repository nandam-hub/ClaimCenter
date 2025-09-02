package edge.capabilities.servicerequest.statement.invoice

uses edge.capabilities.servicerequest.statement.invoice.dto.ServiceRequestInvoiceDTO


/**
 * Plugin used to access claim data.
 * <p>Plugin implementation is responsible for claim access checks.
 */
interface IServiceRequestInvoicePlugin {

  /**
   * Creates a DTO from an existing Service Request. Returns <code>null</code> if invoice is not accessible by current
   * user.
   */
  public function toDTO(sri : ServiceRequestInvoice) : ServiceRequestInvoiceDTO

  /**
   * Converts invoices into DTOs. Ignores all invoices inaccessible by current user.
   */
  public function mapInvoices(sris : ServiceRequestInvoice[]) : ServiceRequestInvoiceDTO[]

}
