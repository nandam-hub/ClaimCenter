package edge.capabilities.extusermgmt.authadminconsole

uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.uaaoperations.dto.ScimUserDTO
uses edge.uaaoperations.dto.FilterRequestDTO
uses edge.uaaoperations.dto.ScimFilterBuilder
uses edge.uaaoperations.dto.ScimFilterOperator
uses edge.di.annotations.InjectableNode
uses edge.uaaoperations.UaaUserOperationsPlugin
uses edge.uaaoperations.UaaGroupOperationsPlugin
uses edge.security.authorization.GrantedAuthoritiesPlugin
uses edge.security.authorization.Authority
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.uaaoperations.dto.UserSearchResultsDTO

class UAAAdministrationHandler extends AbstractRpcHandler {

  private var _userPlugin : UaaUserOperationsPlugin
  private var _authoritiesPlugin : GrantedAuthoritiesPlugin

  @InjectableNode
  @Param("userPlugin", "Plugin used to interface with user endpoint in UAA")
  @Param("authoritiesPlugin", "Plugin used to interface with authorities in UAA")
  construct(userPlugin : UaaUserOperationsPlugin, authoritiesPlugin : GrantedAuthoritiesPlugin){
    this._userPlugin = userPlugin
    this._authoritiesPlugin = authoritiesPlugin
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Get Users.")
  @ApidocAvailableSince("6.0")
  public function getUsers() : UserSearchResultsDTO {
    var filterRequest = new FilterRequestDTO(null, null,0,0,null,null)
    var results = _userPlugin.getUsers(filterRequest)
    return results
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Search Users.")
  @ApidocAvailableSince("6.0")
  public function searchUsers(filters : ScimUserDTO, queryOptions : QueryOptionsDTO) : UserSearchResultsDTO {
    var builder = new ScimFilterBuilder()

    if (filters.UserName != null && !filters.UserName.Empty){
      builder.filter("userName", ScimFilterOperator.CONTAINS, filters.UserName)
    }
    if (filters.Name.GivenName != null && !filters.Name.GivenName.Empty){
      builder.andFilter("givenName",ScimFilterOperator.CONTAINS,filters.Name.GivenName)
    }
    if (filters.Name.FamilyName != null && !filters.Name.FamilyName.Empty){
      builder.andFilter("familyName",ScimFilterOperator.CONTAINS,filters.Name.FamilyName)
    }
    if(queryOptions != null){
      var count = (queryOptions.OffsetEnd - queryOptions.OffsetStart) + 1
      builder.count(count)
      builder.start(queryOptions.OffsetStart)
      var prop = ScimUserDTO.Type.TypeInfo.getProperty(queryOptions.OrderBy)
      if(prop != null){
        if(queryOptions.OrderByDescending){
          builder.sortOrder("descending")
        }
        if(queryOptions.OrderBy.HasContent){
          builder.sortBy(queryOptions.OrderBy)
        }
      }
    }

    var results = _userPlugin.getUsers(builder.build())
    return results
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Create User.")
  @ApidocAvailableSince("6.0")
  public function createUser(user : ScimUserDTO) : ScimUserDTO {
    if (user.UserName == null){
      user.UserName = user.Emails.firstWhere( \ mail -> mail.Primary == true).Value
    }
    return _userPlugin.createUser(user)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Update User.")
  @ApidocAvailableSince("6.0")
  public function updateUser(user : ScimUserDTO) : ScimUserDTO {
    return _userPlugin.updateUser(user)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Get User.")
  @ApidocAvailableSince("6.0")
  public function getUser(userName : String) : ScimUserDTO{
    return _userPlugin.getUserByName(userName)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Add Authorities for User.")
  @ApidocAvailableSince("6.0")
  public function addAuthoritiesForUser(userName : String, grantedAuthorities : Authority[]) : ScimUserDTO{
    for (authority in grantedAuthorities){
      _authoritiesPlugin.addGrantedAuthority(authority, userName)
    }
    return getUser(userName)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Add Authority for User.")
  @ApidocAvailableSince("6.0")
  public function addAuthorityForUser(userName : String, authority : Authority) : ScimUserDTO{
    _authoritiesPlugin.addGrantedAuthority(authority, userName)
    return getUser(userName)
  }

  @JsonRpcRunAsInternalGWUser
    @JsonRpcMethod
  @ApidocMethodDescription("Remove Authorities for User.")
  @ApidocAvailableSince("6.0")
    public function removeAuthoritiesForUser(userName : String, grantedAuthorities : Authority[]) : ScimUserDTO{
      for (authority in grantedAuthorities){
        _authoritiesPlugin.removeGrantedAuthority(authority, userName)
      }

      return getUser(userName)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Remove Authority for User.")
  @ApidocAvailableSince("6.0")
  public function removeAuthorityForUser(userName : String, authority : Authority) : ScimUserDTO{
    _authoritiesPlugin.removeGrantedAuthority(authority, userName)
    return getUser(userName)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("List granted authorities for user.")
  @ApidocAvailableSince("6.0")
  public function listGrantedAuthoritiesForUser(userName : String) : Authority[]{
    return _authoritiesPlugin.getGrantedAuthorities(userName)
  }

  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  @ApidocMethodDescription("Delete User.")
  @ApidocAvailableSince("6.0")
  public function deleteUser(userName : String) : ScimUserDTO {
    return _userPlugin.deleteUser(_userPlugin.getUserIdByName(userName))
  }

}
