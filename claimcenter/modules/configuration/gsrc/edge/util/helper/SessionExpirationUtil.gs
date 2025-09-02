package edge.util.helper
uses java.util.Properties
uses java.io.FileNotFoundException
uses java.io.BufferedInputStream
uses java.io.FileInputStream
uses java.lang.IllegalArgumentException
uses java.io.InputStreamReader

/**
 * This class is a helper function to obtain the session expiration time for elements such as documents and quote submissions.
 * Sessions are used in the portal in cases were we don't access to an authenticated user. For example when a request is made to
 * download a document URL with the session token associated is valid for the window of time that the document session has not expired
 * Different types of elements will have different expiration times.
 *
 */
class SessionExpirationUtil {


  private static final var DEFAULT_SESSION_EXPIRY_PROPERTIES_LOCATION : String = "config/portal/sessionexpiry.properties"

  private static var props : Properties = loadProps(DEFAULT_SESSION_EXPIRY_PROPERTIES_LOCATION)
  /**
   * The caller of the is responsible for passing in a valid <code>key</code> parameter that identifies
   * the type of session element. The caller also knows the time interval of the value returned  e.g. minutes or days
   *
   * @param  key String that identifies the type of session element
   * @return   the expiration value of the session element identified by the <code>key</code> parameter
   * @throws   java.lang.IllegalArgumentException If the <code>key</code> parameter does not match any value in the
  */
  public static function getSessionExpirationForProperty( key: String) : int {
    var expirationStr =  props.getProperty(key)
    if(expirationStr == null) {
      throw new IllegalArgumentException("No matching key for "+key+" in config/portal/sessionexpiry.properties")
    }
    return expirationStr.toInt()
  }

  private static function loadProps(file : String) : Properties {
    final var sessionExpirationPropertiesFile = gw.api.util.ConfigAccess.getConfigFile(file)
    if (sessionExpirationPropertiesFile == null) {
      throw new FileNotFoundException("Properties file not found: " + file)
    }
    final var res = new Properties()
    using(var fi = new FileInputStream(sessionExpirationPropertiesFile)) {
       using(var bi = new BufferedInputStream(fi)) {
         using(var reader = new InputStreamReader(bi, "UTF-8") ) {
          res.load(reader)
         }
       }
    }
    return res
  }

}
