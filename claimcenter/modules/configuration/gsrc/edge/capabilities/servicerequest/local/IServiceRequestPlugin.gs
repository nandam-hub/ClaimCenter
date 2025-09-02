package edge.capabilities.servicerequest.local

uses edge.capabilities.servicerequest.dto.ServiceRequestDTO
/**
 * Plugin used to access claim data.
 * <p>Plugin implementation is responsible for claim access checks.
 */
interface IServiceRequestPlugin {

  /**
   * Creates a DTO from an existing Service Request..
   */
  public function toDTO(sr : ServiceRequest) : ServiceRequestDTO

  function getServiceRequests(claim: Claim): ServiceRequestDTO[]
}
