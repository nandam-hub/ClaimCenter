package edge.uaaoperations

uses edge.uaaoperations.dto.ScimUserDTO
uses edge.uaaoperations.dto.UserSearchResultsDTO
uses edge.uaaoperations.dto.FilterRequestDTO

interface UaaUserOperationsPlugin {

  /**
   * Create the user in UAA with the given parameters.
   *
   * @param user The (partial) user information to be created
   * @return The newly created user. Will have id and meta information set
   */
  function createUser(user: ScimUserDTO): ScimUserDTO

  /**
   * Update the user in UAA. Cannot use this method to change the user's password.
   *
   * @param user the updated user
   * @return the user as returned from the UAA api
   * @see #changeUserPassword(String, String, String)
   */
  function updateUser(user: ScimUserDTO): ScimUserDTO

  /**
   * Delete the user from UAA. Will throw an Exception if the user doesn't exist
   *
   * @param userId The id of the user
   */
  function deleteUser(userId: String) : ScimUserDTO


  /**
   * Logs the user out of UAA
   *
   * @param userId The id of the user
   */
  function logoutUser(userId: String)

  /**
   * Get a user by their username.
   *
   * @param userName the user's username
   * @return the user object for this user, or null if the user does not exist or the operation fails
   */
  function getUserByName(userName: String): ScimUserDTO

  /**
   * Get a page of users
   */
  function  getUsers(query: FilterRequestDTO): UserSearchResultsDTO

  function getUserIdByName(userName: String): String

}
