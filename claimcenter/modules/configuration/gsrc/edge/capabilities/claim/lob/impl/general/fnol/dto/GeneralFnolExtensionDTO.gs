package edge.capabilities.claim.lob.impl.general.fnol.dto

uses edge.capabilities.claim.lob.fnol.dto.IFnolLobExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.FixedPropertyIncidentDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO
uses edge.jsonmapper.JsonProperty

/**
 * LOB extension for a general fnol plugin.
 */
class GeneralFnolExtensionDTO implements IFnolLobExtensionDTO{
  @JsonProperty  
  var _fixedPropertyIncident : FixedPropertyIncidentDTO as FixedPropertyIncident

  @JsonProperty
  var _injuryIncidents : InjuryIncidentDTO[] as InjuryIncidents
}
