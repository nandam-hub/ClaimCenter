package edge.capabilities.claim.lob.impl.homeowners.claimdetail

uses edge.capabilities.claim.lob.claimdetail.ILobClaimDetailPlugin
uses edge.capabilities.claim.lob.shared.incidents.util.IncidentUtil
uses edge.capabilities.claim.lob.impl.homeowners.claimdetail.dto.HOClaimDetailExtensionDTO
uses edge.capabilities.claim.lob.impl.homeowners.claimdetail.dto.HOClaimExposureExtensionDTO
uses edge.di.annotations.InjectableNode

class HOClaimDetailPlugin implements ILobClaimDetailPlugin <HOClaimDetailExtensionDTO, HOClaimExposureExtensionDTO>{

  @InjectableNode
  construct() {

  }

  override function toDTO(claim : Claim) : HOClaimDetailExtensionDTO {
    if (claim.Policy.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      return null
    }

    final var res = new HOClaimDetailExtensionDTO()
    res.FixedPropertyIncidents = claim.FixedPropertyIncidentsOnly.map(\ i -> IncidentUtil.toDTO(i))
    return res
  }

  override function exposureToDTO(exposure : Exposure) : HOClaimExposureExtensionDTO {
    if (exposure.Claim.Policy.PolicyType != PolicyType.TC_HOPHOMEOWNERS) {
      return null
    }
    return new HOClaimExposureExtensionDTO()
  }
}
