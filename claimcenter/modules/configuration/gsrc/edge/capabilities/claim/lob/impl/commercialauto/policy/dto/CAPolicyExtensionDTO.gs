package edge.capabilities.claim.lob.impl.commercialauto.policy.dto

uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.capabilities.claim.lob.policy.dto.IPolicyLobExtensionDTO
uses edge.jsonmapper.JsonProperty

/**
 * CA LOB extension for policy.
 */
class CAPolicyExtensionDTO implements IPolicyLobExtensionDTO {
  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles
}
