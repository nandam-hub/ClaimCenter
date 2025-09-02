package edge.capabilities.claim.auth

uses edge.capabilities.authorization.IEdgeAuthorizationPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.Authorizer

/**
 * Retrieves service request objects from the db, wrapping calls to the Query API to insulate the client code from
 * changes to the Query API across platform versions
 */
class GatewayServiceRequestAuthorizer implements Authorizer<ServiceRequest> {
  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _edgeAuthorizationPlugin : IEdgeAuthorizationPlugin

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  @Param("anEdgeAuthorizationPlugin", "Plugin to check authorization to access entities")
  construct(anEdgeAuthorizationPlugin : IEdgeAuthorizationPlugin) {
    this._edgeAuthorizationPlugin = anEdgeAuthorizationPlugin
  }

  override function canAccess(item : ServiceRequest) : boolean {
    return _edgeAuthorizationPlugin.isAuthorizedOnPolicy(item.Claim.Policy.PolicyNumber)
  }
}
