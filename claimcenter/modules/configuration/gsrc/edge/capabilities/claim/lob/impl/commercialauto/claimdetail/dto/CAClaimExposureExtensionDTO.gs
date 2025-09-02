package edge.capabilities.claim.lob.impl.commercialauto.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.IClaimExposureLobExtensionDTO
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.jsonmapper.JsonProperty

class CAClaimExposureExtensionDTO implements IClaimExposureLobExtensionDTO {
  @JsonProperty
  var _vehicleIncident : VehicleIncidentDTO as VehicleIncident
}
