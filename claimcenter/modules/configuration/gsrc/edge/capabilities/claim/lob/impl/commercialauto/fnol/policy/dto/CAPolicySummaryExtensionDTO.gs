package edge.capabilities.claim.lob.impl.commercialauto.fnol.policy.dto

uses edge.capabilities.claim.lob.fnol.policy.dto.IPolicySummaryLobExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleDTO
uses edge.jsonmapper.JsonProperty

class CAPolicySummaryExtensionDTO implements IPolicySummaryLobExtensionDTO {

  @JsonProperty
  var _vehicles : VehicleDTO[] as Vehicles

}
