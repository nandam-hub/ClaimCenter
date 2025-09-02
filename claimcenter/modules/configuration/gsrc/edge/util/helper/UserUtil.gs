package edge.util.helper

uses gw.api.database.Query

/**
 * Helper functions for operations with users
 */
class UserUtil {
  /**
   * Gets user by user name
   */
  public static function getUserByName(username: String): User {
    var cred = Query.make(Credential).compare("UserName", Equals, username).select().first()
    var user = cred != null ? Query.make(User).compare("Credential", Equals, cred).select().first() : null

    return user
  }
}
