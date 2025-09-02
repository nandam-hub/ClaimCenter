package edge.capabilities.claim.auth

uses edge.capabilities.authorization.IEdgeAuthorizationPlugin
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer

/**
 * Default policy access authorizer. This implementation restricts supported policies
 * to the specific policy type.
 */
class GatewayPolicyAuthorizer implements Authorizer<Policy> {
  /**
   * Plugin to get supported lobs.
   */
  private var _supportedLobsPlugin : ISupportedLobsPlugin
  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _edgeAuthorizationPlugin : IEdgeAuthorizationPlugin

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  @Param("supportedLobsPlugin", "Plugin to get supported lobs")
  @Param("anEdgeAuthorizationPlugin", "Plugin to check authorization to access entities")
  construct(supportedLobsPlugin : ISupportedLobsPlugin,
            anEdgeAuthorizationPlugin : IEdgeAuthorizationPlugin) {
    this._supportedLobsPlugin = supportedLobsPlugin
    this._edgeAuthorizationPlugin = anEdgeAuthorizationPlugin
  }



  override function canAccess(policy : Policy) : boolean {
    final var supportedLobs = _supportedLobsPlugin.getSupportedLobs()

    return supportedLobs.contains(policy.PolicyType) && _edgeAuthorizationPlugin.isAuthorizedOnPolicy(policy.PolicyNumber)
  }

}
