package edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto

uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.claimdetail.dto.IClaimDetailLobExtensionDTO

/**
 * Additional data about personal auto claim.
 */
class PAClaimDetailExtensionDTO implements IClaimDetailLobExtensionDTO{
  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles
  
  @JsonProperty
  var _vehicleIncidents : VehicleIncidentDTO[] as VehicleIncidents
}
