package edge.capabilities.claim.lob.impl.commonauto

uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO

/**
 * Plugin to work with vehicle incidents.
 */
interface IVehicleIncidentPlugin {
  public function toDTO(incident: VehicleIncident) : VehicleIncidentDTO

  public function updateIncident(incident: VehicleIncident, dto: VehicleIncidentDTO)
}
