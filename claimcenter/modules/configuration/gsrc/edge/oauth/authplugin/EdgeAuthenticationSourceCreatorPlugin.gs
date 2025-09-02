package edge.oauth.authplugin

uses gw.auth.gwhub.AuthSourceCreatorPlugin
uses gw.plugin.security.AuthenticationSource
uses jakarta.servlet.http.HttpServletRequest
uses gw.plugin.security.UserNamePasswordAuthenticationSource
uses java.nio.charset.Charset
uses gw.util.Base64Util
uses gw.plugin.security.InvalidAuthenticationSourceData
uses com.nimbusds.jwt.JWTClaimsSet
uses java.lang.Exception
uses edge.servlet.jsonrpc.JsonRpcUnauthenticatedServlet
uses edge.oauth.authplugin.OAuthAuthenticationSource

class EdgeAuthenticationSourceCreatorPlugin extends AuthSourceCreatorPlugin {
  private static final var OAUTH_ATTR_NAME = "OAuthSource"
  private static final var GW_USER_CONTEXT = "GWUserContext"

  override function createSourceFromHTTPRequest(req: HttpServletRequest): AuthenticationSource {
    if (req.getAttribute(JsonRpcUnauthenticatedServlet.UNAUTHENTICATED_USER) != null) {
      return new AnonymousAuthenticationSource()
    }

    var source : AuthenticationSource
    source = getOAuthAuthenticationSource(req)
    if (source == null) {
      source = this.getUserNamePasswordAuthenticationSource(req)
    }
    if (source == null) {
      source = super.createSourceFromHTTPRequest(req)
    }

    return source
  }


  private function getOAuthAuthenticationSource(req: HttpServletRequest): OAuthAuthenticationSource {
    var authHeader = req.getHeader("Authorization")
    var accessToken : String
    if (authHeader != null && authHeader.indexOf("Bearer") != -1) {
      accessToken = authHeader.substring("Bearer".length())?.trim()
    }
    if (req.ParameterNames.toList().contains("access_token")) {
      accessToken = req.getParameter("access_token")
    }
    if(accessToken?.NotBlank) {
      var jwtPlugin = new JwtVerificationPlugin()
      var claimsSet: JWTClaimsSet = null
      try {
        claimsSet = jwtPlugin.verifyToken(accessToken)
      } catch (e: Exception) {
        throw new InvalidAuthenticationSourceData(e)
      }

      var userContextBase64 = req.getHeader(GW_USER_CONTEXT as String)
      var userContext : String
      var oAuthSource : OAuthAuthenticationSource

      if (userContextBase64 != null) {
        userContext = new String(Base64Util.decode(userContextBase64), Charset.forName("UTF-8"))
      }

      oAuthSource = new OAuthAuthenticationSource(claimsSet, userContext)
      req.setAttribute(OAUTH_ATTR_NAME, oAuthSource)
      return oAuthSource
    }
    return null
  }

  private function getUserNamePasswordAuthenticationSource(req: HttpServletRequest): UserNamePasswordAuthenticationSource {
    var authHeader = req.getHeader("Authorization")
    var accessToken : String
    if (authHeader != null && authHeader.indexOf("Basic") != -1) {
      var base64Credentials = authHeader.substring("Basic".length())?.trim()
      if(base64Credentials?.NotBlank) {
        var credentials = new String(Base64Util.decode(base64Credentials), Charset.forName("UTF-8"))
        var value =  credentials.split(":", 2)
        return new UserNamePasswordAuthenticationSource(value[0], value[1])
      }
    }
    var username = req.getParameter("username")
    var pw = req.getParameter("password")

    return username == null || username.trim().isEmpty() ? null : new UserNamePasswordAuthenticationSource(username, pw)
  }
}