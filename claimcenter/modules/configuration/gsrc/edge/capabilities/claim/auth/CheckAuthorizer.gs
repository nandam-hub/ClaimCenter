package edge.capabilities.claim.auth
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType


class CheckAuthorizer implements Authorizer<Check> {
  /**
   * User provider for the check.
   */
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider : EffectiveUserProvider) {
    this._userProvider = aUserProvider
  }

  override function canAccess(item : Check) : boolean {
    var isVendor = UserProvider.EffectiveUser.GrantedAuthorities.hasMatch(\authority -> authority.AuthorityType == AuthorityType.VENDOR)
    return !isVendor
  }
}
