package edge.capabilities.claim.lob.impl.workerscomp.claimdetail

uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.shared.incidents.IInjuryIncidentPlugin
uses edge.capabilities.claim.lob.impl.workerscomp.claimdetail.dto.WCClaimDetailExtensionDTO
uses edge.capabilities.claim.lob.impl.workerscomp.claimdetail.dto.WCClaimExposureExtensionDTO
uses edge.di.annotations.InjectableNode

class WCClaimDetailPlugin implements ILobClaimDetailPlugin<WCClaimDetailExtensionDTO, WCClaimExposureExtensionDTO> {

  @InjectableNode
  @Param("injuryIncidentPlugin", "Plugin used for injury incidents")
  construct(injuryIncidentPlugin : IInjuryIncidentPlugin) {
    this._injuryIncidentPlugin = injuryIncidentPlugin
  }

  private var _injuryIncidentPlugin : IInjuryIncidentPlugin

  override function toDTO(claim : Claim) : WCClaimDetailExtensionDTO {
    if (!isPolicyTypeSupprted(claim.Policy.PolicyType)) {
      return null
    }

    final var res = new WCClaimDetailExtensionDTO()
    res.DateReportedToEmployer = claim.DateRptdToEmployer
    res.IncidentReport = claim.IncidentReport
    return res
  }

  override function exposureToDTO(exposure : Exposure) : WCClaimExposureExtensionDTO {
    if (!isPolicyTypeSupprted(exposure.Claim.Policy.PolicyType)) {
      return null
    }
    return new WCClaimExposureExtensionDTO()
  }

  private function isPolicyTypeSupprted(type: PolicyType): boolean {
    return type == PolicyType.TC_WORKERSCOMP
  }
}
