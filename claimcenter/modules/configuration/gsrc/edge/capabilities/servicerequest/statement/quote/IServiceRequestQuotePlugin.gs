package edge.capabilities.servicerequest.statement.quote

uses edge.capabilities.servicerequest.statement.quote.dto.ServiceRequestQuoteDTO


/**
 * Plugin used to access claim data.
 * <p>Plugin implementation is responsible for claim access checks.
 */
interface IServiceRequestQuotePlugin {

  /**
   * Creates a DTO from an existing Service Request..
   */
  public function toDTO(srq : ServiceRequestQuote) : ServiceRequestQuoteDTO

}
