package edge.capabilities.claim.fnol.policy
uses java.util.Date

uses edge.capabilities.claim.fnol.dto.FnolDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySearchCriteriaDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryRiskUnitsDTO

/**
 * Plugin used to search for policies for a fnol process.
 */
interface IPolicySearchPlugin {
  /**
   * Searches for policy summaries for the policies.
   */
  public function findPolicySummaries(criteria : PolicySearchCriteriaDTO) : PolicySummaryDTO[]
  
  
  /**
   * Returns policy for the user given the policy number.
   */
  public function getPolicy(policyNumber : String, fnolDTO : FnolDTO) :  Policy


  /**
   * Returns Risk Units for a particular policy
   */
  public function getPolicySummaryRiskUnits(policyNumber : String, lossDate : Date) : PolicySummaryRiskUnitsDTO
}
