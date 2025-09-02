package edge.oauth.authplugin

uses gw.plugin.security.AuthenticationSource

class AnonymousAuthenticationSource implements AuthenticationSource {

  override property get Hash(): char[] {
    return "AnonymousUser".toCharArray()
  }

  override function determineSourceComplete(): boolean {
    return true
  }

}
