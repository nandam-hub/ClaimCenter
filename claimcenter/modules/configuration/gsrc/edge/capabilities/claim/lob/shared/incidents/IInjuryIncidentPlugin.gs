package edge.capabilities.claim.lob.shared.incidents

uses edge.capabilities.claim.lob.shared.incidents.dto.InjuryIncidentDTO

/**
 * Plugin to work with injury incidents.
 */
interface IInjuryIncidentPlugin {
  public function toDTO(incident : InjuryIncident) : InjuryIncidentDTO

  public function updateIncident(incident : InjuryIncident, dto : InjuryIncidentDTO)
}
