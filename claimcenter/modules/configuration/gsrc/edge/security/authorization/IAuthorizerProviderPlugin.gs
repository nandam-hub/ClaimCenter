package edge.security.authorization

interface IAuthorizerProviderPlugin {
  reified function authorizerFor<T>(t:Type<T>):Authorizer<T>
}
