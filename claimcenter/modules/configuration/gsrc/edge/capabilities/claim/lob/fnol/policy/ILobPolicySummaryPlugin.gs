package edge.capabilities.claim.lob.fnol.policy

uses edge.capabilities.claim.fnol.dto.FnolDTO

interface ILobPolicySummaryPlugin <T> {

  public function toDTO(policySummary : PolicySummary) : T

  public function selectPolicySummaryRiskUnits(policySummary: PolicySummary, fnolDto : FnolDTO)

  public function haveRiskUnitsChanged(policy : Policy, fnolDto : FnolDTO): boolean
}
