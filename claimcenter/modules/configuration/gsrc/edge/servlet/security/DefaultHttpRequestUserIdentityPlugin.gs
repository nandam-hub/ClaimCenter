package edge.servlet.security

uses com.nimbusds.jwt.JWTClaimsSet

uses java.util.regex.Pattern
uses java.lang.IllegalArgumentException
uses jakarta.servlet.http.HttpServletRequest

uses edge.di.annotations.ForAllGwNodes
uses edge.security.EffectiveUser
uses edge.security.authorization.Authority
uses edge.security.authorization.AuthorityType
uses edge.security.authorization.AccessLevel
uses edge.oauth.authplugin.OAuthAuthenticationSource
uses edge.servlet.jsonrpc.JsonRpcUnauthenticatedServlet

/**
 * Default implementation of user identity plugin compatible retrieves user details from the jwt access token
 * passed through the Authorization header
 */
class DefaultHttpRequestUserIdentityPlugin implements IHttpRequestUserIdentityPlugin {

  private static final var OAUTH_ATTR_NAME = "OAuthSource"
  private static final var GW_USER_CONTEXT = "GWUserContext"


  @ForAllGwNodes
  construct() {
  }

  override function getEffectiveUserFromRequest(req : HttpServletRequest) : EffectiveUser {
    var effectiveUser : EffectiveUser
    var hasOAuthSource = req.getAttribute(OAUTH_ATTR_NAME) != null

    if (hasOAuthSource) {
      return getEffectiveUserFromOAuthSource(req)
    }

    if (req.getAttribute(JsonRpcUnauthenticatedServlet.UNAUTHENTICATED_USER) != null) {
      //anonymous access
      effectiveUser = new EffectiveUser(null, null, null, null)
    } else {
      var currentUser = User.util.CurrentUser
      //Internal user logging in with username and password
      effectiveUser = new EffectiveUser(currentUser.Credential.UserName, null, currentUser, null)
    }
    return effectiveUser
  }

  private function getEffectiveUserFromOAuthSource(req : HttpServletRequest) : EffectiveUser {
    final var currentUser = User.util.CurrentUser
    final var accessToken = getAccessToken(req)
    final var oAuthSource = req.getAttribute(OAUTH_ATTR_NAME) as OAuthAuthenticationSource
    final var userContext = req.getHeader(GW_USER_CONTEXT)

    var userId = getUserId(oAuthSource.Claims)

    if (oAuthSource.IsInternalUser) {
      //Internal user logging in with jwt token issued by xcenter
      return new EffectiveUser(oAuthSource.Username, null, currentUser, userId, accessToken)
    }

    if (oAuthSource.IsServiceUser) {
      var user = oAuthSource.serviceUser
      if (oAuthSource.IsInternalUserForThisApplication) {

        if (user == null) {
          throw new IllegalArgumentException("Access token user identifier not found in request header")
        }
      }
      return new EffectiveUser(user, null, currentUser, userId, accessToken, userContext)
    }

    if (oAuthSource.HasServiceUserAuthorities) {
      if (oAuthSource.serviceUserAuthorities == null) {
        throw new IllegalArgumentException("Access token user authorities not found in request header")
      }

      var grantedAuthorities = getGrantedAuthorities(oAuthSource.Claims, oAuthSource.serviceUserAuthorities)
      return new EffectiveUser(oAuthSource.Username, grantedAuthorities, null, userId, accessToken, userContext)
    }


    //external user
    var grantedAuthorities = getGrantedAuthorities(oAuthSource.Claims, null)
    return new EffectiveUser(getUserName(oAuthSource), grantedAuthorities, null, userId, accessToken)
  }


  private function getAccessToken(req : HttpServletRequest) : String {
    var authHeader = req.getHeader("Authorization")
    var accessToken : String
    if (authHeader != null && authHeader.indexOf("Bearer") != -1) {
      accessToken = authHeader.substring("Bearer".length())?.trim()
    }
    if (req.ParameterNames.toList().contains("access_token")) {
      accessToken = req.getParameter("access_token")
    }
    return accessToken;
  }


  private function getGrantedAuthorities(claimSet : JWTClaimsSet, grantedAuthoritiesList : List<String>) : List<Authority> {
    var grantedAuthorityClaim = claimSet.Claims.get("grantedAuthorities")
    if (grantedAuthoritiesList == null) {
      if (grantedAuthorityClaim typeis String) {
        grantedAuthoritiesList = (grantedAuthorityClaim as String).split(" ").toList()
      } else {
        grantedAuthoritiesList = grantedAuthorityClaim as List<String>
      }
    }

    return (grantedAuthoritiesList)
        .where(\scope -> scope.indexOf("guidewire.edge.") != -1)
        .map(\authorityStr -> {
          var authorityTypes = AuthorityType.AllValues.join('|')
          var p = Pattern.compile("^guidewire\\.edge\\.(${authorityTypes})\\.(.*)\\.(.*)$", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
          var m = p.matcher(authorityStr)
          if (!m.find()) {
            throw new IllegalArgumentException("Invalid scope for granted authority ${authorityStr}")
          }
          var authorityType = AuthorityType.valueOf(m.group(1).toUpperCase())
          var authorityValue = m.group(2)
          var accessLevel = AccessLevel.valueOf(m.group(3).toUpperCase())
          return new Authority(authorityType, authorityValue, accessLevel)
        })
  }

  private function getUserId(claimSet : JWTClaimsSet) : String {
    if (claimSet != null && claimSet.Claims != null) {
      var userId = claimSet.Claims.get("user_id") as String
      if (userId == null) {
        userId = claimSet.Claims.get("https://guidewire.com/user_id") as String
      }
      return userId
    }
    return null;
  }

  private function getUserName(oAuthSource : OAuthAuthenticationSource) : String {
    if (oAuthSource.Username != null) {
      return oAuthSource.Username
    }
    var claimSet = oAuthSource.Claims as JWTClaimsSet
    if (claimSet != null && claimSet.Claims != null) {
      return claimSet.Claims.get("sub") as String
    }
    return null;
  }
}
