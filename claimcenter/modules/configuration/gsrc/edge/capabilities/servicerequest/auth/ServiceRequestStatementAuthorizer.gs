package edge.capabilities.servicerequest.auth

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.capabilities.servicerequest.util.ServiceRequestEntity
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authorizer
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class ServiceRequestStatementAuthorizer implements Authorizer<ServiceRequestStatement> {
  private static final var LOG = new Logger(Reflection.getRelativeName(ServiceRequestStatementAuthorizer))
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(srs:ServiceRequestStatement):boolean{
    var serviceRequest = ServiceRequestEntity.getFromStatement(srs)
    return UserProvider.EffectiveUser.hasAuthority(AuthorityType.VENDOR, serviceRequest.Specialist.AddressBookUID)
  }

}
