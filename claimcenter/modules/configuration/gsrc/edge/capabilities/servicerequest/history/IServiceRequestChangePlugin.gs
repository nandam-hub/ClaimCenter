package edge.capabilities.servicerequest.history

uses edge.capabilities.servicerequest.history.dto.ServiceRequestChangeDTO

interface IServiceRequestChangePlugin {

  /**
   * Creates DTOs for provided sources. Ignores requests not accessible by current user.
   */
  public function mapHistory(srcs : ServiceRequestChange[]) : ServiceRequestChangeDTO[]

}
