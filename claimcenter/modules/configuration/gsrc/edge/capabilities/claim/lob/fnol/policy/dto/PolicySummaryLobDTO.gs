package edge.capabilities.claim.lob.fnol.policy.dto

uses java.util.Map
uses java.util.HashMap

class PolicySummaryLobDTO {

  protected var lobExtensions : Map<typekey.PolicyType, IPolicySummaryLobExtensionDTO> = new HashMap<typekey.PolicyType, IPolicySummaryLobExtensionDTO>()

}
