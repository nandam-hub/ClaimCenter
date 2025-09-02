package edge.capabilities.claim.lob.impl.general.claimdetail

uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.general.claimdetail.dto.GeneralClaimDetailExtensionDTO
uses edge.capabilities.claim.lob.impl.general.claimdetail.dto.GeneralClaimExposureExtensionDTO
uses edge.capabilities.claim.lob.shared.incidents.util.IncidentUtil

abstract class GeneralClaimDetailPlugin implements ILobClaimDetailPlugin <GeneralClaimDetailExtensionDTO, GeneralClaimExposureExtensionDTO>{

  private var _injuryIncidentPlugin : IInjuryIncidentPlugin

  construct(injuryIncidentPlugin : IInjuryIncidentPlugin) {
    this._injuryIncidentPlugin = injuryIncidentPlugin
  }

  abstract function isPolicyTypeSupprted(type: PolicyType) : boolean;

  override function toDTO(claim : Claim) : GeneralClaimDetailExtensionDTO {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return null
    }

    final var res = new GeneralClaimDetailExtensionDTO()
    res.FixedPropertyIncidents = claim.FixedPropertyIncidentsOnly.map(\ i -> IncidentUtil.toDTO(i))
    res.InjuryIncidents = claim.InjuryIncidentsOnly.map(\ i -> _injuryIncidentPlugin.toDTO(i))
    return res
  }

  override function exposureToDTO(exposure : Exposure) : GeneralClaimExposureExtensionDTO {
    if (!isPolicyTypeSupprted(exposure.Claim.Policy.PolicyType)) {
      return null
    }
    return new GeneralClaimExposureExtensionDTO()
  }  
}
