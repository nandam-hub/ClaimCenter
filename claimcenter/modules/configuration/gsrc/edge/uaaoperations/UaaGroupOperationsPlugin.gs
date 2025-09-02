package edge.uaaoperations

uses edge.uaaoperations.dto.ScimGroupDTO
uses edge.uaaoperations.dto.FilterRequestDTO
uses edge.uaaoperations.dto.GroupSearchResultsDTO

interface UaaGroupOperationsPlugin {

  function createGroup(group: ScimGroupDTO): ScimGroupDTO

  function deleteGroup(groupId: String) : ScimGroupDTO

  function addMember(groupId: String, memberName: String) : ScimGroupDTO

  function addMember(group: ScimGroupDTO, memberId: String): ScimGroupDTO

  function removeMember(groupId: String, memberName: String) : ScimGroupDTO

  function removeMember(group: ScimGroupDTO, memberId: String) : ScimGroupDTO

  function getGroupByName(name: String) : ScimGroupDTO

  function getGroups(request: FilterRequestDTO) : GroupSearchResultsDTO

}
