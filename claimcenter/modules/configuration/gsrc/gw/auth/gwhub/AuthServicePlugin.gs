package gw.auth.gwhub

uses gw.api.system.PLLoggerCategory
uses gw.auth.AuthHelper

@Export
class AuthServicePlugin extends BaseAuthServicePlugin {

  /**
   * This method returns alternative username/public ids to try
   *
   * @param userName email address from the id token
   * @return list of other usernames to try
   */
  protected override function getAlternativeUserNames(userName : String) : List<String> {
    var tryUserName = AuthHelper.verifyAndRemoveEmailDomain(userName)
    if (tryUserName != userName) {
      return Collections.singleton(tryUserName) as List<String>
    }
    return Collections.emptyList()
  }

  /**
   * IMPLEMENTATION NOTE:  This logic will be executed if the user was found.  You can exclude certain users or
   * validate user information based on the id token.
   *
   * @param userPublicId the public id of the user
   * @param source the TokenSource
   * @param idpConfig the config object for this specific idp
   */
  @SuppressWarnings("unused")
  override protected function checkForChanges(userPublicId : String, source : TokenAuthSource, idpConfig : IdpAuthConfig) {
    var user = User.publicFinder.findByPublicID(userPublicId)
    PLLoggerCategory.UI_REQUEST.debug(AUTH_SERVICE_MARKER, "From='{}', found user '{}' checking", { source.RemoteAddress, user.Credential.UserName})
    if (!user.Credential.Active) {
      throw new RuntimeException("Account locked")
    }
//    if (user.UnrestrictedUser) {
//      throw new RuntimeException("No SU")
//    }
  }


  /**
   * IMPLEMENTATION NOTE:  This logic will be executed if no matching user is found.  You may be able to construct a suitable
   * user from the token.
   *
   * @param source the TokenSource
   * @param idpConfig the config object for this specific idp
   */
  @SuppressWarnings("unused")
  override protected function userNotFound(source : TokenAuthSource, idpConfig : IdpAuthConfig) : String {
    var user : User

    return user.PublicID
  }
}