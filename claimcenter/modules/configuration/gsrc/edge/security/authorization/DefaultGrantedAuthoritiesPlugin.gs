package edge.security.authorization

uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUserProvider

class DefaultGrantedAuthoritiesPlugin implements GrantedAuthoritiesPlugin {
  protected var _userProvider : EffectiveUserProvider

  @ForAllGwNodes
  @Param("userProvider", "Plugin that retrieves authenticated user from ThreadLocal")
  construct(userProvider: EffectiveUserProvider) {
    this._userProvider = userProvider
  }

  override function addGrantedAuthority(authority: Authority) {
    throw new UnsupportedOperationException("This functionality is not available.");
  }

  override function addGrantedAuthority(authority: Authority, userName: String) {
    throw new UnsupportedOperationException("This functionality is not available.");
  }

  override function removeGrantedAuthority(authority: Authority) {
    throw new UnsupportedOperationException("This functionality is not available.");
  }

  override function removeGrantedAuthority(authority: Authority, userName: String) {
    throw new UnsupportedOperationException("This functionality is not available.");
  }

  override function getGrantedAuthorities(userName: String) : Authority[] {
    throw new UnsupportedOperationException("This functionality is not available.");
  }

}
