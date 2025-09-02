package edge.capabilities.claim.fnol.policy

uses edge.di.annotations.InjectableNode
uses edge.security.EffectiveUserProvider
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.doc.ApidocMethodDescription
uses edge.doc.ApidocAvailableSince
uses edge.capabilities.claim.fnol.policy.dto.PolicySearchCriteriaDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryDTO

class GatewayPolicySearchHandler extends  PolicySearchHandler {
  private var _policySearchPlugin : IPolicySearchPlugin

  @InjectableNode
  construct(policySearchPlugin : IPolicySearchPlugin, aUserProvider: EffectiveUserProvider) {
    super(policySearchPlugin, aUserProvider)
    this._policySearchPlugin = policySearchPlugin
  }

  /**
   * Using the search criteria defined in the PolicySearchDTO, perform a search using
   * the policy search plugin. The resultant policies are cross reference against the
   * authorized policies defined in the user principal.
   *
   * @param policySummaryDto The object that defines the criteria to search policies against
   * @return The matching policies as a PolicySummaryDTO array. Returns empty array if there are no policies.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Using the search criteria defined in the PolicySearchDTO, perform a search using the policy search plugin. The resultant policies are cross reference against the authorized policies defined in the user principal.")
  @ApidocAvailableSince("5.0")
  public function searchPolicies(criteria: PolicySearchCriteriaDTO) : PolicySummaryDTO[] {
    return this._policySearchPlugin.findPolicySummaries(criteria)
  }
}
