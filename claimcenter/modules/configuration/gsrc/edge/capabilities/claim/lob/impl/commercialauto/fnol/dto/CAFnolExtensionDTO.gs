package edge.capabilities.claim.lob.impl.commercialauto.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO
uses edge.jsonmapper.JsonProperty

/**
 * CA LOB extension for a fnol plugin.
 */
class CAFnolExtensionDTO implements IFnolLobExtensionDTO{
  @JsonProperty
  var _fixedPropertyIncident : FixedPropertyIncidentDTO as FixedPropertyIncident

  @JsonProperty  // Not in PAFnolLobUpdateExtensionDTO
  var _vehicles : VehicleDTO[] as Vehicles

  @JsonProperty
  var _vehicleIncidents : VehicleIncidentDTO[] as VehicleIncidents

}
