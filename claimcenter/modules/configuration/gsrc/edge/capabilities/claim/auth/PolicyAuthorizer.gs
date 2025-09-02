package edge.capabilities.claim.auth
uses edge.capabilities.claim.contact.util.ClaimContactUtil
uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.security.authorization.AuthorityType
uses edge.security.EffectiveUserProvider

/**
 * Default policy access authorizer. This implementation restricts supported policies
 * to the specific policy type. Any of the following matching authorities would allow access to
 * the policy:
 * <ul>
 *   <li> POLICY authority for the policy's number.
 *   <li> PRODUCER authority with the policy's producer code.
 *   <li> VENDOR authority matching address book ID for any vendor on policy's claim.
 * </ul>
 */
class PolicyAuthorizer implements Authorizer<Policy> {
  /**
   * PLugin to get supported lobs.
   */
  private var _supportedLobsPlugin : ISupportedLobsPlugin

  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("address")
  @ForAllGwNodes("authority")
  @ForAllGwNodes("claim")
  @ForAllGwNodes("document")
  @ForAllGwNodes("enrolment")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("locale")
  @ForAllGwNodes("segmentation")
  @ForAllGwNodes("servicerequest")
  @Param("supportedLobsPlugin", "Plugin to get supported lobs")
  construct(aUserProvider:EffectiveUserProvider, supportedLobsPlugin : ISupportedLobsPlugin) {
    this._supportedLobsPlugin = supportedLobsPlugin
    this._userProvider = aUserProvider
  }

  override function canAccess(policy : Policy) : boolean {
    if (!_supportedLobsPlugin.getSupportedLobs().contains(policy.PolicyType)) {
      return false
    }
    var user = UserProvider.EffectiveUser
    if (user.hasAuthority(AuthorityType.POLICY, policy.PolicyNumber)) {
      return true
    }
    
    if (user.hasAuthority(AuthorityType.PRODUCER, policy.ProducerCode)) {
      return true
    }

    if (user.hasAuthority(AuthorityType.ACCOUNT, policy.AccountNumber)) {
      return true
    }
    
    final var vendorAuths = user.getTargets(AuthorityType.VENDOR)
    if (vendorAuths.HasElements &&
        policy.Claim.Contacts.where(\cc -> ClaimContactUtil.isVendor(cc))*.Contact*.AddressBookUID
            .hasMatch(\s -> vendorAuths.contains(s))) {
      return true
    }
    
    return false
  }

}
