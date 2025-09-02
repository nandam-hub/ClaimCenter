package edge.capabilities.claim.lob.impl.general.claimdetail.dto

uses edge.capabilities.claim.lob.claimdetail.dto.IClaimDetailLobExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.jsonmapper.JsonProperty

class GeneralClaimDetailExtensionDTO implements IClaimDetailLobExtensionDTO{

  @JsonProperty
  var _fixedPropertyIncidents : FixedPropertyIncidentDTO[] as FixedPropertyIncidents

  @JsonProperty
  var _injuryIncidents : InjuryIncidentDTO[] as InjuryIncidents
}
