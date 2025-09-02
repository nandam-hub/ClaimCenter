package edge.capabilities.claim.auth

uses edge.capabilities.claim.contact.util.ClaimContactUtil
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer

/**
 * Access authorizer to claim contacts.
 */
class GatewayClaimContactAuthorizer implements Authorizer<ClaimContact> {

  private var _supportedLobsPlugin: ISupportedLobsPlugin
  private var _userProvider: EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("gatewaydocument")
  @Param("supportedLobsPlugin", "Plugin used to get supported lobs")
  construct(supportedLobsPlugin: ISupportedLobsPlugin) {
    _supportedLobsPlugin = supportedLobsPlugin
  }

  override function canAccess(contact: ClaimContact): boolean {
    if (!_supportedLobsPlugin.getSupportedLobs().contains(contact.Claim.Policy.PolicyType)) {
      return false
    }

    return true
  }
}
