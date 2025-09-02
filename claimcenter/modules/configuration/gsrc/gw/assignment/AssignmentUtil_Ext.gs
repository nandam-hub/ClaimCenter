package gw.assignment

uses entity.Group
uses entity.GroupUser
uses typekey.VacationStatusType

class AssignmentUtil_Ext {

  static function getEligibleUsersFromGroupAndChildren(group: Group): List<GroupUser> {
    var result = new ArrayList<GroupUser>()

    if (group == null) return result

    for (gu in group.Users) {
      if (isEligible(gu)) {
        result.add(gu)
      }
    }

    for (child in group.ChildGroups) {
      result.addAll(getEligibleUsersFromGroupAndChildren(child))
    }

    return result
  }

  private static function isEligible(gu: GroupUser): boolean {
    return gu != null and
        gu.User != null and
        gu.User.Credential != null and
        gu.User.Credential.Active and
        gu.Member and
        gu.User.VacationStatus == VacationStatusType.TC_ATWORK
  }
}
