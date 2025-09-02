package edge.security.authorization

uses edge.security.EffectiveUser
uses edge.security.EffectiveUserProvider

/**
 * Interface used to check authorization rights for entities of type T.
 * @param T type of supported item.
 */
interface Authorizer<T> {
  /**
   * Checks if <code>item</code> could be accessed in the context of <code>context</code>.
   */
  public function canAccess(item : T) : boolean

  /**
   * The user provider used to retrieve the current user information
   */
  public property get UserProvider():EffectiveUserProvider
}
