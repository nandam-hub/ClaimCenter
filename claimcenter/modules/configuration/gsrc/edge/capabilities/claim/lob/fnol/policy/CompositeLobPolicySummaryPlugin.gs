package edge.capabilities.claim.lob.fnol.policy

uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.claim.lob.fnol.policy.dto.PolicySummaryLobDTO
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses edge.di.annotations.ForAllGwNodes
uses edge.di.boot.Bootstrap
uses java.util.Map

class CompositeLobPolicySummaryPlugin implements ILobPolicySummaryPlugin<PolicySummaryLobDTO> {

  private var _lobMap : Map<String, ILobPolicySummaryPlugin>

  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobPolicySummaryPlugin >(new CapabilityAndPath("fnol", Path.parse("policysummary.lob")))
  }

  override function toDTO(policySummary : PolicySummary) : PolicySummaryLobDTO {
    final var res = new PolicySummaryLobDTO()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDTO(policySummary)
    }
    return res
  }


  override function selectPolicySummaryRiskUnits(policySummary: PolicySummary, fnolDto : FnolDTO)  {
    for (entry in _lobMap.entrySet()) {
      entry.Value.selectPolicySummaryRiskUnits(policySummary, fnolDto)
    }
  }

  override function haveRiskUnitsChanged(policy: Policy, fnolDto : FnolDTO): boolean {
    var res =  false
    for (entry in _lobMap.entrySet()) {
      res = entry.Value.haveRiskUnitsChanged(policy, fnolDto)
      if(res){
        break
      }
    }
    return res
  }
}
