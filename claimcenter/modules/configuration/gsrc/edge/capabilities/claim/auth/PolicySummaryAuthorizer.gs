package edge.capabilities.claim.auth
uses edge.security.authorization.Authorizer
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.claim.lob.ISupportedLobsPlugin
uses edge.security.authorization.AuthorityType
uses edge.security.EffectiveUserProvider

/**
 * Access rules for the policy summary.
 */
class PolicySummaryAuthorizer implements Authorizer<PolicySummary>{
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
    _userProvider = aUserProvider
  }



  override function canAccess(summary : PolicySummary) : boolean {
    var user = _userProvider.EffectiveUser
    if (!_supportedLobsPlugin.getSupportedLobs().contains(summary.PolicyType)) {
      return false
    }
    
    if (user.hasAuthority(AuthorityType.POLICY, summary.PolicyNumber)) {
      return true
    }
    
    if (user.hasAuthority(AuthorityType.PRODUCER, summary.ProducerCode)) {
      return true
    }
    
    if (user.hasAuthority(AuthorityType.PRODUCER, summary.ProducerCodeCode)) {
      return true
    }

    if (user.hasAuthority(AuthorityType.ACCOUNT, summary.AccountNumber)) {
      return true
    }
    
    return false
  }

}
