package edge.capabilities.claim.auth

uses edge.capabilities.authorization.IEdgeAuthorizationPlugin
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer


class GatewayClaimRptAuthorizer implements Authorizer<ClaimRpt> {
  /**
   * User provider for the claim rpt.
   */
  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _edgeAuthorizationPlugin : IEdgeAuthorizationPlugin

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  @Param("anEdgeAuthorizationPlugin", "Plugin to check authorization to access entities")
  construct(anEdgeAuthorizationPlugin : IEdgeAuthorizationPlugin) {
    this._edgeAuthorizationPlugin = anEdgeAuthorizationPlugin
  }

  override function canAccess(item : ClaimRpt) : boolean {
    return _edgeAuthorizationPlugin.isAuthorizedOnPolicy(item.Claim.Policy.PolicyNumber)
  }
}
