package edge.capabilities.servicerequest.summary

uses edge.capabilities.servicerequest.summary.dto.ServiceRequestSummaryDTO

interface IServiceRequestSummaryPlugin {
  /**
   * Creates a DTO from an existing Service Request. Ignores all service requests not accessible by current user.
   */
  public function mapSummaries(srs : ServiceRequest[]) : ServiceRequestSummaryDTO[]
}
