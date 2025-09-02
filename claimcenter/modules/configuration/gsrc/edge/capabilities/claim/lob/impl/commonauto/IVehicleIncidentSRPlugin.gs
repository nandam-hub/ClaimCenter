package edge.capabilities.claim.lob.impl.commonauto

uses edge.capabilities.claim.lob.impl.commonauto.dto.RepairOptionDTO
uses entity.RepairOption_Ext

interface IVehicleIncidentSRPlugin {
  public function updateRepairOption(incident: VehicleIncident, dto: RepairOptionDTO, existingRepairOption: RepairOption_Ext)
  public function createServiceRequest(incident: VehicleIncident, dto: RepairOptionDTO)
  public function toDTO(incident: VehicleIncident) : RepairOptionDTO
}
