package edge.capabilities.claim.auth
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType


class ClaimRptAuthorizer implements Authorizer<ClaimRpt> {
  /**
   * User provider for the claim rpt.
   */
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("address")
  @ForAllGwNodes("authority")
  @ForAllGwNodes("claim")
  @ForAllGwNodes("document")
  @ForAllGwNodes("enrollment")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("locale")
  @ForAllGwNodes("segmentation")
  @ForAllGwNodes("servicerequest")
  construct(aUserProvider : EffectiveUserProvider) {
    this._userProvider = aUserProvider
  }

  override function canAccess(item : ClaimRpt) : boolean {
    return UserProvider.EffectiveUser.hasAuthority(AuthorityType.PRODUCER, item.Claim.Policy.ProducerCode)
  }
}
