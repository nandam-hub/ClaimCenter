package edge.capabilities.servicerequest.auth

uses edge.security.authorization.Authorizer
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes
uses edge.security.authorization.AuthorityType

/**
  * Retrieves service request objects from the db, wrapping calls to the Query API to insulate the client code from
  * changes to the Query API across platform versions
  */
class ServiceRequestAuthorizer implements Authorizer<ServiceRequest>{

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(ServiceRequestAuthorizer))
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes("servicerequest")
  construct(aUserProvider: EffectiveUserProvider) {
    _userProvider = aUserProvider
  }

  override function canAccess(serviceRequest: ServiceRequest): boolean {
    return UserProvider.EffectiveUser.hasAuthority(AuthorityType.VENDOR, serviceRequest.Specialist.AddressBookUID)
  }

}
