package edge.util

uses com.guidewire.commons.grn.GrnPlanetClass
uses com.guidewire.pl.system.dependency.PLDependencies
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses jakarta.servlet.http.HttpServletRequest

class EdgeBasicAuthUtil {

  private static final var LOGGER = new Logger(Reflection.getRelativeName(EdgeBasicAuthUtil))

  /* RPC methods which are whitelisted */
  final static var basicAuthWhitelistedMethods = new ArrayList<String>() {'getMetaData', 'translate', 'getLocaleConfig', 'getCoverableAPIDescription'}

  /**
   * Checks whether the request is using Basic authentication
   * @param req the HTTP request
   * @return true if and only if the request is using a Basic auth header
   **/
  public static function hasBasicAuth(req: HttpServletRequest): Boolean {
    final var authHeader = req.getHeader("Authorization")
    if(authHeader == null) {
      return false
    }

    return (authHeader as String).startsWith("Basic")
  }

  /**
  * Allows Basic Auth for non-prod environment along with the whitelisted RPC methods it would be allowed
  **/
  public static function isBasicAuthAllowed(methodName: String, accessToken: String): Boolean {

    if(accessToken == null) {
      if(isProductionServer()) {
        return false
      } else {
        if(!basicAuthWhitelistedMethods.contains(methodName.trim())) {
            LOGGER.logDebug("Edge basic auth not supported for method: " + methodName)
            return false
        }
        return true
      }
    } else {
      return true
    }
  }


  /**
  * Checks the environment of the server (Prod, preprod, dev, etc.).
  **/
  private static function isProductionServer() : Boolean {
    return PLDependencies.getServerMode().isProduction()
  }

}