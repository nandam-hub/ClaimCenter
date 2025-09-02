package edge.capabilities.servicerequest.local

uses edge.capabilities.servicerequest.dto.ServiceRequestDTO

/**
 * Plugin used to create services for testing purposes. Enabled only with internal debug tools.
 */
interface IServiceRequestCreationPlugin {

  function createServiceRequest(claimNumber: String, serviceKind : ServiceRequestKind, submitInstruction : Boolean): ServiceRequestDTO

}
