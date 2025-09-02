package edge.security.authorization
uses edge.security.EffectiveUserProvider
uses edge.di.annotations.InjectableNode

/**
 * Authorization layer bypass. Allows all entities to be accessed regardless of the current user.
 * Needed by Carbon due to type system restrictions.
 */
class AllowAllAuthorizer<T> implements Authorizer<T> {
  private var _userProvider : EffectiveUserProvider

  @InjectableNode
  construct(up : EffectiveUserProvider) {
    this._userProvider = up
  }

  override function canAccess(item : T) : boolean {
    return true
  }

  override property get UserProvider() : EffectiveUserProvider {
    return _userProvider
  }

}
