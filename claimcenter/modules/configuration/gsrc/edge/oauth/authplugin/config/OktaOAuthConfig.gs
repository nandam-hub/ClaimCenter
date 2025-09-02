package edge.oauth.authplugin.config

uses gw.api.util.ConfigAccess
uses gw.util.concurrent.LockingLazyVar

uses java.io.FileInputStream

class OktaOAuthConfig {

  private static final var OKTA_JWT_CONFIG_FILE : String = "config/portal/okta.properties"
  private static final var OKTA_JWT_CONNECTION_TIMEOUT : String = "okta.jwt.connection.timeout"
  private static final var OKTA_JWT_AUTHENTICATION_TIMEOUT : String = "okta.jwt.authentication.timeout"

  private static var _config : LockingLazyVar<Properties> = LockingLazyVar.make(\-> loadProps())

  private static function loadProps() : Properties {
    var configFile = ConfigAccess.getConfigFile(OKTA_JWT_CONFIG_FILE)
    var configProperties = new Properties()
    using (var is = new FileInputStream(configFile)) {
      configProperties.load(is)
    }
    return configProperties
  }

  static property get JWTAuthenticationConnectionTimeout() : Integer {
    return _config.get().get(OKTA_JWT_CONNECTION_TIMEOUT) as Integer
  }

  static property get JWTAuthenticationReadTimeout() : Integer {
    return _config.get().get(OKTA_JWT_AUTHENTICATION_TIMEOUT) as Integer
  }

}
