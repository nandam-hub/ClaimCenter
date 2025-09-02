package edge.security

uses java.util.Set
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.Authority
uses edge.jsonmapper.JsonProperty
uses edge.security.authorization.exception.AuthorizationException

/**
 * Information about effective user and associated authorities.
 */
final class EffectiveUser {
  
  /** Name of the user. */
  @JsonProperty
  private var _username : String as Username

  /** Optional Zone for user **/
  @JsonProperty
  private var _realm : Realm as Realm

  /**
   * Authorities allowed for the user. This set is effectively immutable.
   * We do not want anybody to change authorities on the fly.
   */
  @JsonProperty
  private var _authorities : Authority[] as GrantedAuthorities

  /** Optional Realm for user **/
  private var _internalGwUser : User as InternalGWUser

  /** Name of the user. */
  @JsonProperty
  private var _uaaUserId : String as UaaUserId

  private var _token: String as Token

  /**
   * User Context passed to other IS applications when connecting on
   * behalf of the user
   */
  @JsonProperty
  private var _userContext: String as UserContext


  construct(name : String, auths : List<Authority>, anInternalGwUser: User, aUaaUserId : String, token: String, userContext: String) {
    this(name, auths, anInternalGwUser, aUaaUserId, token)
    this._userContext = userContext
  }

  construct(name : String, auths : List<Authority>, anInternalGwUser: User, aUaaUserId : String, token: String) {

    this(name, auths, anInternalGwUser, aUaaUserId)
    _token = token
  }
  
  construct(name : String, realmVal: Realm, auths : List<Authority>, anInternalGwUser: User, aUaaUserId : String) {
    this._username = name != null ? name : "NO_AUTHENTICATED_PORTAL_USER"
    this._authorities = auths != null ? auths.toTypedArray() : {}
    this._realm = realmVal == null ? Realm.getDefault() : realmVal
    this._internalGwUser = anInternalGwUser
    this._uaaUserId = aUaaUserId
  }

  construct() {
    this("NO_AUTHENTICATED_PORTAL_USER", edge.security.Realm.getDefault(), {}, null, null)
  }

  /**
   * Creates a new effective user definition.
   */
  construct(name : String, auths : List<Authority>, anInternalGwUser: User, aUaaUserId : String) {
    this(name, edge.security.Realm.getDefault(), auths, anInternalGwUser, aUaaUserId)
  }
  
  /**
   * Convenience method. Checks if user have an access to a specific authority.
   */
  public function hasAuthority(auth : Authority) : Boolean {
    return GrantedAuthorities.contains(auth)
  }
  
  /**
   * Convenience method. Checks if user have an access to a specific authority.
   */
  public function hasAuthority(auth : AuthorityType, target : String) : Boolean {
    return hasAuthority(new Authority(auth, target))
  }
  
  /**
   * Returns targets for the given authority type.
   */
  public function getTargets(auth : AuthorityType) : Set<String> {
    return GrantedAuthorities.where(\ a -> a.AuthorityType == auth).map(\a -> a.Target).toSet()
  }

  /**
   * Return unique target for the given authority type.
   *
   * @throws AuthorizationException If user have either no or more than one authority with the given type.
   */
  public function getUniqueTarget(auth : AuthorityType) : String {
    final var ids = getTargets(auth)

    if (ids.size != 1) {
      throw new AuthorizationException(){:Message = "User is not authorized to access unique authority of the type: " + auth}
    }

    return ids.first()
  }
}
