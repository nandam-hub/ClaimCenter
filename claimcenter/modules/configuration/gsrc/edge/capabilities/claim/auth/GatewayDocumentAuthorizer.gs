package edge.capabilities.claim.auth

uses edge.capabilities.authorization.IEdgeAuthorizationPlugin
uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider

/**
 * Document access logic.
 */
class GatewayDocumentAuthorizer implements Authorizer<Document> {

  private var _userProvider : EffectiveUserProvider as readonly UserProvider
  private var _edgeAuthorizationPlugin : IEdgeAuthorizationPlugin

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  construct(aUserProvider : EffectiveUserProvider, anEdgeAuthorizationPlugin : IEdgeAuthorizationPlugin) {
    _userProvider = aUserProvider
    _edgeAuthorizationPlugin = anEdgeAuthorizationPlugin
  }

  override function canAccess(doc : Document) : boolean {

    if (!isPortalDefaultAccessible(doc) || !perm.Document.view(doc)) {
      return false
    }

    var hasPolicyAccess = _edgeAuthorizationPlugin.isAuthorizedOnPolicy(doc.Claim.Policy.PolicyNumber)

    return hasPolicyAccess
  }

  /**
   * Checks if document is accessible to any portal. Some documents may be restricted
   * for the portal users (like sensitive documents or internal documents).
   */
  static function isPortalDefaultAccessible(document : Document) : Boolean {
    if ( document.SecurityType != DocumentSecurityType.TC_UNRESTRICTED && document.SecurityType != null) {
      return false
    }

    if (document.Retired || document.Obsolete ) {
      return false
    }

    return true
  }


}
