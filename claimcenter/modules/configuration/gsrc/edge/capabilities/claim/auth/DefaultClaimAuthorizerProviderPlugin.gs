package edge.capabilities.claim.auth

uses edge.security.authorization.Authorizer

uses java.util.HashMap
uses java.util.Map
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.MapUtil
uses edge.security.authorization.AllowAllAuthorizer
uses edge.di.annotations.InjectableNode

class DefaultClaimAuthorizerProviderPlugin implements IAuthorizerProviderPlugin {
  private var _userProvider : EffectiveUserProvider
  private var _authorizers : Map<Type,Authorizer>


  @ForAllGwNodes("claim")
  @ForAllGwNodes("gatewayclaim")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("gatewayfnol")
  @ForAllGwNodes("document")
  @ForAllGwNodes("gatewaydocument")
  construct(
        aUserProvider:EffectiveUserProvider,
        activityAuthz:Authorizer<Activity>,
        documentAuthz:Authorizer<Document>,
        claimAuthz:Authorizer<Claim>,
        policyAuthz:Authorizer<Policy>,
        noteAuthz:Authorizer<Note>,
        claimContactAuthz:Authorizer<ClaimContact>,
        serviceRequestAuthz: Authorizer<ServiceRequest>,
        claimRptAuthorizer: Authorizer<ClaimRpt>,
        checkAuthorizer: Authorizer<Check>
  ) {
    _authorizers = new HashMap<Type,Authorizer>()
    _authorizers.put(Activity, activityAuthz)
    _authorizers.put(Note,noteAuthz)
    _authorizers.put(Document,documentAuthz)
    _authorizers.put(Claim,claimAuthz)
    _authorizers.put(Policy,policyAuthz)
    _authorizers.put(ClaimContact,claimContactAuthz)
    _authorizers.put(ServiceRequest,serviceRequestAuthz)
    _authorizers.put(ClaimRpt,claimRptAuthorizer)
    _authorizers.put(Check,checkAuthorizer)
    _userProvider = aUserProvider
  }

  override reified function authorizerFor<T>(type: Type<T>): Authorizer<T> {
    return MapUtil.getOrUpdate(_authorizers, type, \ -> new AllowAllAuthorizer<T>(_userProvider)) as Authorizer<T>
  }
}
