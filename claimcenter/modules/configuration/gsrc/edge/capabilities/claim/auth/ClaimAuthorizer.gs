package edge.capabilities.claim.auth
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider

/**
 * Default authorization for the claim access. It assumes that claim
 * is available iff claim's policy is available.
 */
class ClaimAuthorizer implements Authorizer<Claim> {
  /**
   * Policy authorizer for the claim.
   */
  private var _policyAuthorizer : Authorizer<Policy>


  @ForAllGwNodes
  @Param("policyAuthorizer", "Policy access authorization plugin")
  construct(policyAuthorizer : Authorizer<Policy>) {
    this._policyAuthorizer = policyAuthorizer
  }
  

  override function canAccess(item : Claim) : boolean {
    return _policyAuthorizer.canAccess(item.Policy)
  }

  public property get UserProvider() : EffectiveUserProvider {
    return _policyAuthorizer.UserProvider
  }
}
