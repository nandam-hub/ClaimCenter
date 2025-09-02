package edge.capabilities.claim.lob.impl.personalauto.policy.dto

uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.policy.dto.IPolicyLobExtensionDTO

/**
 * PA LOB extension for policy.
 */
class PAPolicyExtensionDTO implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles
}
