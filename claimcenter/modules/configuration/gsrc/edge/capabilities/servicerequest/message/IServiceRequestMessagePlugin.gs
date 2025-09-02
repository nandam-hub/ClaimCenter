package edge.capabilities.servicerequest.message

uses edge.capabilities.servicerequest.message.dto.ServiceRequestMessageDTO

interface IServiceRequestMessagePlugin {

  /**
   * Creates an array of DTOs from an existing Service Request Message array. Entities inaccessible by current
   * user are excluded from the resulting array.
   */
  public function mapMessages(srm : ServiceRequestMessage[]) : ServiceRequestMessageDTO[]
}
