package edge.capabilities.claim.lob.claimdetail
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimDetailLobDTO
uses edge.capabilities.claim.lob.claimdetail.dto.ClaimExposureLobDTO
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path

class CompositeLobClaimDetailPlugin implements ILobClaimDetailPlugin < ClaimDetailLobDTO, ClaimExposureLobDTO > {
  
  private var _lobMap : Map<String, ILobClaimDetailPlugin >

  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobClaimDetailPlugin >(new CapabilityAndPath("claim", Path.parse("claimdetails.lob")))
  }

  override function toDTO(claim : Claim) : ClaimDetailLobDTO {
    final var res = new ClaimDetailLobDTO ()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDTO(claim)
    }
    return res
  }

  override function exposureToDTO(exposure : Exposure) : ClaimExposureLobDTO {
    final var res = new ClaimExposureLobDTO ()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.exposureToDTO(exposure)
    }
    return res
  }

}
