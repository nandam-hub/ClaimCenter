package edge.capabilities.claim.auth

uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.AuthorityType

class ActivityAuthorizer implements Authorizer<Activity> {
  var _userProvider : EffectiveUserProvider as readonly UserProvider
  @ForAllGwNodes
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(activity: Activity): boolean {
    return UserProvider.EffectiveUser.hasAuthority(AuthorityType.VENDOR, activity.ExternalOwner.AddressBookUID)
  }
}
