package edge.uaaoperations

uses edge.uaaoperations.dto.ScimGroupDTO
uses java.lang.IllegalArgumentException
uses edge.uaaoperations.uaaclient.UaaOAuthClientBuilder
uses edge.uaaoperations.dto.ScimFilterBuilder
uses edge.uaaoperations.dto.ScimFilterOperator
uses edge.uaaoperations.dto.GroupSearchResultsDTO
uses edge.uaaoperations.dto.FilterRequestDTO
uses java.util.ArrayList
uses edge.uaaoperations.dto.ScimGroupMemberDTO
uses edge.di.annotations.InjectableNode
uses edge.di.annotations.ForAllGwNodes
uses edge.uaaoperations.uaaclient.UaaConnectionException
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger

class DefaultUaaGroupOperationsPlugin implements UaaGroupOperationsPlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultUaaGroupOperationsPlugin))

  private static final var USR_MGMT_CLIENT = "usermgmt"
  private var uaaClientConnection: UaaOAuthClientBuilder.UaaConnection
  private var uaaUserOperations: UaaUserOperationsPlugin

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
    uaaUserOperations = new DefaultUaaUserOperationsPlugin(uaaClientConnection)
  }

  override function createGroup(group: ScimGroupDTO): ScimGroupDTO {
    if (group == null) {
      throw new IllegalArgumentException("group parameter cannot be null")
    }
    if (group.DisplayName == null or group.DisplayName.Empty) {
      throw new IllegalArgumentException("DisplayName parameter must be set")
    }
    setUAAConnection()
    return uaaClientConnection.httpPost<ScimGroupDTO, ScimGroupDTO>("/Groups", group)
  }

  override function deleteGroup(groupId: String) : ScimGroupDTO {
    if (groupId == null) {
      throw new IllegalArgumentException("groupId cannot be null")
    }
    setUAAConnection()
    return uaaClientConnection.httpDelete<ScimGroupDTO>("/Groups/${groupId}")
  }

  override function addMember(groupId: String, memberId: String): ScimGroupDTO {
    if (memberId == null or groupId == null) {
      throw new IllegalArgumentException("groupId and memberName cannot be null")
    }
    var group = getGroupById(groupId)
    return addMember(group, memberId)
  }

  override function addMember(group: ScimGroupDTO, memberId: String): ScimGroupDTO {
    if (memberId == null) {
      throw new IllegalArgumentException("memberName cannot be null")
    }
    var members = group.Members
    if (members == null) {
      members = new ArrayList<ScimGroupMemberDTO>(1)
    }

    var member = new ScimGroupMemberDTO(memberId)
    members.add(member)
    group.Members = members
    return updateGroup(group)

  }

  override function removeMember(groupId: String, memberId: String): ScimGroupDTO {
    if (memberId == null) {
      throw new IllegalArgumentException("memberName cannot be null")
    }
    var group = getGroupById(groupId)
    return removeMember(group, memberId)
  }

  override function removeMember(group: ScimGroupDTO, memberId: String): ScimGroupDTO {
    if (memberId == null) {
      throw new IllegalArgumentException("memberName cannot be null")
    }

    var members = group.Members
    if (members == null) {
      throw new IllegalArgumentException("Membername does not exist for group: ${group.DisplayName}")
    }

    var member = new ScimGroupMemberDTO(memberId)
    members.remove(member)
    group.Members = members
    return updateGroup(group)
  }

  override function getGroupByName(name: String) : ScimGroupDTO {
    if (name == null) {
      throw new IllegalArgumentException("group name cannot be null")
    }
    var builder = new ScimFilterBuilder().filter("displayName", ScimFilterOperator.EQUALS, name)
    var query = builder.build()
    setUAAConnection()
    var result = uaaClientConnection.httpGet<GroupSearchResultsDTO>(query.buildScimFilterUrl("/Groups"))
    if (result.TotalResults > 0) {
      return result.Resources.first()
    }
    return null
  }

  override function getGroups(request: FilterRequestDTO) : GroupSearchResultsDTO {
    if (request == null) {
      throw new IllegalArgumentException("request cannot be null")
    }
    setUAAConnection()
    return uaaClientConnection.httpGet<GroupSearchResultsDTO>(request.buildScimFilterUrl("/Groups"))
  }

  private function getGroupById(groupId: String): ScimGroupDTO {
    var builder = new ScimFilterBuilder().filter("id", ScimFilterOperator.EQUALS, groupId)
    var query = builder.build()
    var results = getGroups(query)

    if (results.TotalResults > 0) {
      return results.Resources[0]
    }
    return null
  }

  private function updateGroup(group: ScimGroupDTO): ScimGroupDTO {
    if (group == null) {
      throw new IllegalArgumentException("group cannot be null")
    }
    setUAAConnection()
    return uaaClientConnection.httpPut<ScimGroupDTO, ScimGroupDTO>("/Groups/${group.Id}", group)
  }

  private function setUAAConnection() {
    if (uaaClientConnection == null) {
      uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(USR_MGMT_CLIENT, true)
    }
    uaaUserOperations = new DefaultUaaUserOperationsPlugin(uaaClientConnection)
  }
}
