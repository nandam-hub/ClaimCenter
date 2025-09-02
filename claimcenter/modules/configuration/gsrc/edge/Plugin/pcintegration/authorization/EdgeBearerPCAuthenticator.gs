package edge.Plugin.pcintegration.authorization

uses com.thetransactioncompany.jsonrpc2.client.ConnectionConfigurator
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection

uses java.net.HttpURLConnection

class EdgeBearerPCAuthenticator implements ConnectionConfigurator {
  private static final var GW_USER_CONTEXT_HEADER = "GWUserContext"

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(EdgeBearerPCAuthenticator))

  private var _token: String as Token
  private var _userContext: String as UserContext

  construct(token: String, userContext: String) {
    _token = token
    _userContext = userContext
  }

  override function configure(httpURLConnection: HttpURLConnection) {

    if (_token == null) {
      throw new IllegalArgumentException("PC Authenticator effective user token is not valid")
    }

    httpURLConnection.addRequestProperty("Authorization", "Bearer " + _token)
    if (_userContext != null) {
      httpURLConnection.addRequestProperty(GW_USER_CONTEXT_HEADER, _userContext)
    }
  }
}
