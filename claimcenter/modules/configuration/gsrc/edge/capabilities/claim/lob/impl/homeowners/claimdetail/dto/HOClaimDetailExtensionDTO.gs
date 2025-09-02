package edge.capabilities.claim.lob.impl.homeowners.claimdetail.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO
uses edge.capabilities.claim.lob.claimdetail.dto.IClaimDetailLobExtensionDTO

class HOClaimDetailExtensionDTO implements IClaimDetailLobExtensionDTO{

  @JsonProperty
  var _fixedPropertyIncidents : FixedPropertyIncidentDTO[] as FixedPropertyIncidents
}
