package edge.capabilities.claim.lob.fnol

uses edge.capabilities.claim.lob.fnol.dto.FnolLobDTO
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses edge.di.annotations.ForAllGwNodes

class CompositeLobFnolPlugin implements ILobFnolPlugin < FnolLobDTO, FnolLobDTO > {

  private var _lobMap : Map<String, ILobFnolPlugin >

  @ForAllGwNodes("fnol")
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobFnolPlugin >(new CapabilityAndPath("fnol", Path.parse("fnol.lob")))
  }

  construct(capability : String) {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobFnolPlugin >(new CapabilityAndPath(capability, Path.parse("fnol.lob")))
  }

  override function toDTO(claim : Claim) : FnolLobDTO {
    final var res = new FnolLobDTO ()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDTO(claim)
    }
    return res
  }


  override function updateClaim(claim : Claim, dto : FnolLobDTO, isInit : boolean) {
    for (entry in _lobMap.entrySet()) {
      entry.Value.updateClaim(claim, dto[entry.Key], isInit)
    }
  }

  override function submitClaim(claim: Claim, dto: FnolLobDTO) {
    for (entry in _lobMap.entrySet()) {
      entry.Value.submitClaim(claim, dto[entry.Key])
    }
  }

}
