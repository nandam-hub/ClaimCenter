package edge.uaaoperations

uses edge.uaaoperations.dto.ScimUserDTO
uses edge.uaaoperations.dto.FilterRequestDTO
uses edge.uaaoperations.dto.UserSearchResultsDTO
uses java.lang.IllegalArgumentException
uses edge.uaaoperations.uaaclient.UaaOAuthClientBuilder
uses edge.uaaoperations.dto.ScimFilterBuilder
uses edge.uaaoperations.dto.ScimFilterOperator
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.di.annotations.ForAllGwNodes
uses edge.uaaoperations.uaaclient.UaaConnectionException
uses java.lang.Throwable

class DefaultUaaUserOperationsPlugin implements UaaUserOperationsPlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultUaaUserOperationsPlugin))

  private static final var USR_MGMT_CLIENT = "usermgmt"
  private var uaaClientConnection: UaaOAuthClientBuilder.UaaConnection

  @ForAllGwNodes
  construct() {
    try {
      setUAAConnection()
    } catch(e: UaaConnectionException) {
      _logger.logWarn("Unable to connect to UAA on startup. Another connection attempt will be made at the time of the request")
    }
  }

  construct(uaaConnection: UaaOAuthClientBuilder.UaaConnection)  {
     uaaClientConnection = uaaConnection
  }

  override function createUser(user: ScimUserDTO): ScimUserDTO {
    if (user == null or user.UserName == null) {
      throw new IllegalArgumentException("Username must be set")
    }
    setUAAConnection()
    return uaaClientConnection.httpPost<ScimUserDTO, ScimUserDTO>("/Users", user)
  }

  override function updateUser(user: ScimUserDTO): ScimUserDTO {
    if (user == null or user.Id == null) {
      throw new IllegalArgumentException("Id property must be set")
    }
    // don't try to update the stuff we can't update here
    if (user.Groups.size() > 0) {
      user.Groups.clear()
    }
    user.Password = null
    setUAAConnection()
    return uaaClientConnection.httpPut<ScimUserDTO, ScimUserDTO>("/Users/${user.Id}", user)
  }

  override function logoutUser(userId: String) {
    setUAAConnection()
    uaaClientConnection.httpGet("/oauth/token/revoke/user/${userId}")
  }

  override function deleteUser(userId: String) : ScimUserDTO{
    if (userId == null) {
      throw new IllegalArgumentException("UserId parameter must be set")
    }
    setUAAConnection()
    return uaaClientConnection.httpDelete<ScimUserDTO>("/Users/${userId}")
  }

  override function getUserByName(userName: String): ScimUserDTO {
    if (userName == null) {
      throw new IllegalArgumentException("userName parameter must be set")
    }
    var builder = new ScimFilterBuilder().filter("userName", ScimFilterOperator.EQUALS, userName)
    var query = builder.build()
    setUAAConnection()
    try {
      var retval = uaaClientConnection.httpGet<UserSearchResultsDTO>(query.buildScimFilterUrl("/Users"))
      var resources = retval.Resources

      if (resources.length == 0) {
        return null
      }

      return resources.first()
    }catch (t: Throwable) {
      _logger.logError(t)
      return null
    }
  }

  override function getUsers(query: FilterRequestDTO): UserSearchResultsDTO {
    if (query == null) {
      throw new IllegalArgumentException("query parameter must be set")
    }
    setUAAConnection()
    return uaaClientConnection.httpGet<UserSearchResultsDTO>(query.buildScimFilterUrl("/Users"))
  }

  override function getUserIdByName(userName: String): String {
    if (userName == null) {
      throw new IllegalArgumentException("userName parameter must be set")
    }

    var builder = new ScimFilterBuilder().filter("userName", ScimFilterOperator.EQUALS, userName).attributes({"id"})
    var query = builder.build()
    setUAAConnection()
    try {
      var retval = uaaClientConnection.httpGet<UserSearchResultsDTO>(query.buildScimFilterUrl("/Users"))
      var resources = retval.Resources

      if (resources.length == 0) {
        return null
      }

      return resources.first().Id
    }catch (t: Throwable) {
      _logger.logError(t)
      return null
    }
  }

  private function setUAAConnection() {
    if (uaaClientConnection == null) {
      uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(USR_MGMT_CLIENT, true)
    }
  }
}
