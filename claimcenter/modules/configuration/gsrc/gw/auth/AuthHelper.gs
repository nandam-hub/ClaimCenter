package gw.auth

uses gw.auth.gwhub.AuthConfig
uses gw.auth.gwhub.AuthUtil

/**
 * This class is used by the ui, to check if it should change behavior and supply some values for messages and exits.
 * This can be modified so that the pcf pages remain unchanged.
 */
@SuppressWarnings({"HiddenPackageReference", "unused"})
@Export
class AuthHelper {

  /**
   * IMPLEMENTORS NOTE:  this is the list of host names for email address
   */
  private static final var EMAIL_DOMAINS = Set.of(
      // "sample.com"
  )

  /**
   * This will verify that the email host is a known host and if so, will string the host.
   *
   * @param userName the username
   *
   * @return a possible changed username
   */
  static function verifyAndRemoveEmailDomain(userName : String) : String {
    if (!EMAIL_DOMAINS.Empty && userName?.contains("@")) {
      var userNameParts = userName.split("@")
      if (EMAIL_DOMAINS.contains(userNameParts[1])) {
        return userNameParts[0]
      }
    }
    return userName
  }

  public static final var SESSION_ATTRIBUTE_FILTER_ACTIVE : String = AuthConfig.SESSION_ATTRIBUTE_FILTER_ACTIVE
  public static final var SESSION_ATTRIBUTE_UID : String = AuthConfig.SESSION_ATTRIBUTE_UID
  public static final var SESSION_ATTRIBUTE_FULL_NAME : String = AuthConfig.SESSION_ATTRIBUTE_FULL_NAME
  public static final var SESSION_ATTRIBUTE_EMAIL : String = AuthConfig.SESSION_ATTRIBUTE_EMAIL

  /**
   * This will return true if the is login fields should be displayed.
   *
   * IMPLEMENTATION NOTE: Customers who need to use both during testing (i.e., to create new users as su) can
   * change this to reflect that sometimes even with oauth enabled they want those fields active.
   *
   * @return true to display fields
   */
  static function displayLoginFields() : boolean {
    return !AuthConfig.Instance.FilterActive
  }

  /**
   * This will return the oauth log out field
   *
   * @return the url
   */
  static property get LogoutUrl() : String {
    return AuthConfig.Instance.LogoutUrl
  }

  static function hasErrorMessage() : boolean {
    var message = errorMessage()
    return message != null
  }

  /**
   * Extract the OAuth error message from the session by directly accessing the session.
   *
   * @return the error message if there is one, otherwise null.
   */
  static function errorMessage() : String {
    return AuthUtil.ErrorMessageInSession
  }

  static function message(loginFormMessage : String) : String {
    if (loginFormMessage != null && !loginFormMessage.Empty) {
      return loginFormMessage
    }
    return errorMessage()
  }
}