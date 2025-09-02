package edge.capabilities.claim.lob.impl.personalauto.claimdetail.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.impl.commonauto.dto.VehicleIncidentDTO
uses edge.capabilities.claim.lob.claimdetail.dto.IClaimExposureLobExtensionDTO

class PAClaimExposureExtensionDTO implements IClaimExposureLobExtensionDTO{
  @JsonProperty
  var _vehicleIncident : VehicleIncidentDTO as VehicleIncident
}
