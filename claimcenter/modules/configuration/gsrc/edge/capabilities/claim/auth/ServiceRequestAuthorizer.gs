package edge.capabilities.claim.auth

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUser
uses edge.security.EffectiveUserProvider
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer

/**
  * Retrieves service request objects from the db, wrapping calls to the Query API to insulate the client code from
  * changes to the Query API across platform versions
  */
class ServiceRequestAuthorizer implements Authorizer<ServiceRequest>{

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(ServiceRequestAuthorizer))
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("claim")
  @ForAllGwNodes("fnol")
  @ForAllGwNodes("document")
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(serviceRequest: ServiceRequest): boolean {
    var user = UserProvider.EffectiveUser

    if (user.hasAuthority(AuthorityType.PRODUCER, serviceRequest.Claim.Policy.ProducerCode)) {
      return true

    }

    if (user.hasAuthority(AuthorityType.POLICY, serviceRequest.Claim.Policy.PolicyNumber)) {
      if (serviceRequest.Claim.Policy.PolicyType == PolicyType.TC_WORKERSCOMP) {
        if (serviceRequest.Claim.getContactByRole(ContactRole.TC_CLAIMANT) == serviceRequest.Instruction.CustomerContactGw) {
          return true
        }
      } else {
        if (serviceRequest.Claim.Policy.insured == serviceRequest.Instruction.CustomerContactGw) {
          return true
        }
      }
    } else if (hasAccessToAccount(user, serviceRequest.Claim.Policy.AccountNumber)) {
      return true
    }

    return false;
  }

  private function hasAccessToAccount(user: EffectiveUser, accountNumber: String) : Boolean {
    return user.GrantedAuthorities.firstWhere(\auth -> auth.AuthorityType == AuthorityType.ACCOUNT && auth.Target == accountNumber) != null
  }

}
