package edge.capabilities.claim.fnol.policy
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryRiskUnitsDTO
uses edge.di.annotations.InjectableNode
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.AbstractRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.claim.fnol.policy.dto.PolicySearchCriteriaDTO
uses edge.capabilities.claim.fnol.policy.dto.PolicySummaryDTO
uses java.util.Date
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.exception.EntityPermissionException

/**
 * Handler used to retrieve fnol policies.
 */
class PolicySearchHandler extends AbstractRpcHandler {
  
  private var _policySearchPlugin : IPolicySearchPlugin
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  @Param("policySearchPlugin", "Plugin used to search for the policies")
  construct(policySearchPlugin : IPolicySearchPlugin, aUserProvider: EffectiveUserProvider) {
    this._policySearchPlugin = policySearchPlugin
    this._userProvider = aUserProvider
  }



  /**
   * Using the search criteria defined in the PolicySearchDTO, perform a search using
   * the policy search plugin. The resultant policies are cross reference against the 
   * authorized policies defined in the user principal.
   * 
   * @param policySummaryDto The object that defines the criteria to search policies against
   * @return The matching policies as a PolicySummaryDTO array.
   *         Empty array if there are no policies.
   * @throws EntityPermissionException if the user is a policyholder and they provided an account number different to
   *         their own.
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Using the search criteria defined in the PolicySearchDTO, perform a search using the policy search plugin. The resultant policies are cross reference against the authorized policies defined in the user principal.")
  @ApidocAvailableSince("5.0")
  public function searchPolicies(criteria: PolicySearchCriteriaDTO) : PolicySummaryDTO[]{
    // If the user has authority for one account, we assume that the current user is a policyholder
    var isPolicyholderUser = _userProvider.EffectiveUser.getTargets(AuthorityType.ACCOUNT).size() == 1
    if (isPolicyholderUser) {
      return retrievePoliciesForPolicyholder(criteria)
    }
    return retrievePoliciesForProducer(criteria)

  }


  /**
   * Method returning the Risk Units for a particular policy to be selected for draft claim creation based on PolicySummary
   * @param policyNumber
   * @param lossDate
   * @return the Risk Units per LOBs
   */
  @JsonRpcMethod
  @ApidocMethodDescription("Method returning the Risk Units for a particular policy to be selected for draft claim creation based on PolicySummary.")
  @ApidocAvailableSince("5.0")
  public function getPolicySummaryRiskUnits(policyNumber : String, lossDate : Date) : PolicySummaryRiskUnitsDTO {
    return _policySearchPlugin.getPolicySummaryRiskUnits(policyNumber, lossDate)
  }

  /**
   * Policy search for policyholder users. Uses the effective users account number to search for policies.
   * @param policySummaryDto The object that defines the criteria to search policies against
   * @return The matching policies as a PolicySummaryDTO array.
   *         Empty array if there are no policies.
   * @throws EntityPermissionException if the user is a policyholder and they provided an account number different to
   *         their own.
  */
  protected function retrievePoliciesForPolicyholder(criteria: PolicySearchCriteriaDTO) : PolicySummaryDTO[] {
    /* To make searching policies more optimal for policyholders, we add the current users account number to the
    *  criteria to only return policies for that user.
    */
    final var accountNumber =_userProvider.EffectiveUser.getUniqueTarget(AuthorityType.ACCOUNT)
    if (criteria.AccountNumber !== null && !criteria.AccountNumber.equals(accountNumber)) {
      throw new EntityPermissionException()
    }
    criteria.AccountNumber = accountNumber
    return _policySearchPlugin.findPolicySummaries(criteria)
  }

  /**
   * Policy search for non-policyholder users
   * @param policySummaryDto The object that defines the criteria to search policies against
   * @return The matching policies as a PolicySummaryDTO array.
   *         Empty array if there are no policies.
   */
  protected function retrievePoliciesForProducer(criteria: PolicySearchCriteriaDTO) : PolicySummaryDTO[]  {
    return _policySearchPlugin.findPolicySummaries(criteria)
  }

}
