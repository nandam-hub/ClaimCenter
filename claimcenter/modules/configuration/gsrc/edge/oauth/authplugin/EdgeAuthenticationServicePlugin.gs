package edge.oauth.authplugin

uses java.util.Map

uses gw.plugin.security.AuthenticationSource
uses gw.plugin.InitializablePlugin
uses java.lang.IllegalArgumentException
uses gw.pl.exception.GWConfigurationException
uses gw.plugin.security.AuthenticationServicePluginCallbackHandler
uses gw.auth.gwhub.AuthServicePlugin
uses javax.security.auth.login.FailedLoginException

class EdgeAuthenticationServicePlugin extends AuthServicePlugin implements InitializablePlugin {

  public static var PolicyHolderIntegrationUser : String

  private static final var PH_USERNAME_KEY = "policyholder.integration.username"

  /**
   * Private variable to hold the plugin call back handler used to look up users
   */
  private var handler: AuthenticationServicePluginCallbackHandler = null

  override function authenticate(source: AuthenticationSource): String {
    if (handler == null) {
      throw new IllegalArgumentException("Callback handler not set")
    }
    if (source typeis OAuthAuthenticationSource) {
      //token is verified in EdgeAuthenticationSourceCreatorPlugin

      if (source.IsJwtInvalidForThisApplication) {
        throw new FailedLoginException("ApplicationID does not match ScriptParameter.")
      }

      if (source.IsServiceUser && source.IsInternalUserForThisApplication) {
        if (source.serviceUser == null) {
          throw new FailedLoginException("Access token user identifier not found in request header")
        }
        var internalUserPublicID = handler.findUser(source.serviceUser)
        return internalUserPublicID
      }

      if (source.IsInternalUser && source.IsInternalUserForThisApplication) {
        var internalUserPublicID = handler.findUser(source.Username)
        return internalUserPublicID
      }
      return handler.findUser(PolicyHolderIntegrationUser)
    }
    if (source typeis AnonymousAuthenticationSource) {
      return handler.findUser(PolicyHolderIntegrationUser)
    }

    return super.authenticate(source)
  }

  override property set Callback(cbh:AuthenticationServicePluginCallbackHandler) {
    this.handler = cbh
    super.Callback = cbh
  }

  override property set Parameters(params : Map<Object, Object>) {
    PolicyHolderIntegrationUser = params.get(PH_USERNAME_KEY) as String

    if (PolicyHolderIntegrationUser == null) {
      throw new GWConfigurationException("The parameters policyholder.integration.username must be configured")
    }
  }
}
