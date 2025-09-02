package edge.capabilities.servicerequest.auth

uses edge.security.authorization.Authorizer

uses java.util.HashMap
uses java.util.Map
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.ForAllGwNodes

class DefaultServiceRequestAuthorizerProviderPlugin implements IAuthorizerProviderPlugin {
  
  class PassThroughAuthorizer<T> implements Authorizer<T> {
    override function canAccess(item: T): boolean {
      return true
    }

    override property get UserProvider(): EffectiveUserProvider {
      return _userProvider
    }
  }
  
  var _userProvider : EffectiveUserProvider
  var _authorizers : Map<Type,Authorizer>

  @ForAllGwNodes("servicerequest")
  construct(aUserProvider:EffectiveUserProvider,servReqAuthz:Authorizer<ServiceRequest>,servReqStatementAuthz:Authorizer<ServiceRequestStatement>, documentAuthorizer:Authorizer<Document>) {
    _authorizers = new HashMap<Type,Authorizer>()
    _authorizers.put(ServiceRequest, servReqAuthz)
    _authorizers.put(ServiceRequestStatement,servReqStatementAuthz)
    _authorizers.put(Document, documentAuthorizer)
    _userProvider = aUserProvider
  }

  override reified function authorizerFor<T>(type: Type<T>): Authorizer<T> {
    var authz = _authorizers.get(type)
    if ( authz == null ) {
      authz = new PassThroughAuthorizer<T>()
      _authorizers.put(type,authz)
    }
    return authz as Authorizer<T>
  }
}
