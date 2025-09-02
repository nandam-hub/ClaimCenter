package edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.IClaimDetailLobExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.jsonmapper.JsonProperty

class CAClaimDetailExtensionDTO implements IClaimDetailLobExtensionDTO {
  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles

  @JsonProperty
  var _vehicleIncidents : VehicleIncidentDTO[] as VehicleIncidents
}
