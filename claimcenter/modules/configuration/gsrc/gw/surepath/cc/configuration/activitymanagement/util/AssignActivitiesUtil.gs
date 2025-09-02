package gw.surepath.cc.configuration.activitymanagement.util

uses entity.Activity
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Activity Management: Utility class for assigning an activity
 */
@IncludeInDocumentation
class AssignActivitiesUtil {

  /**
   * Gets all of the available groups
   *
   * @return IQueryBeanResult<Group>
   */
  @IncludeInDocumentation
  public static function getGroupQuerySortedByGroupName() : gw.api.database.IQueryBeanResult<Group> {
    var query = Query.make(Group).select()
    query.orderBy(QuerySelectColumns.path(Paths.make(Group#Name)))
    return query
  }

  /**
   * Gets all of the assignable queues that belong to groups
   *
   * @return AssignableQueue[]
   */
  @IncludeInDocumentation
  public static function getAssignableQueues() : AssignableQueue[] {
    var groups = getGroupQuerySortedByGroupName().toTypedArray()
    var queues = groups.flatMap(\elt -> elt.AssignableQueues)
    return queues
  }

  /**
   * Uses an activity's activity pattern to determine if the activity should be
   * assigned to a queue or a group.
   * Will assign to a queue if one is specified. Will assign to a group's members if no queue is specified.
   *
   * @param activity
   */
  @IncludeInDocumentation
  public static function assignToQueueOrGroup(activity : Activity) {
    var queueToAssign = activity.ActivityPattern?.AssignableQueue_SP
    var groupToAssign = activity.ActivityPattern?.Group_SP
    if (queueToAssign != null) {
      AssignActivitiesUtil.assignToQueue(queueToAssign, activity)
    } else if (groupToAssign != null) {
      AssignActivitiesUtil.assignUserByRoundRobinWithBackup(activity, groupToAssign)
    }
  }

  /**
   * Will assign the activity to the queue
   *
   * @param queueToAssign
   * @param activity
   */
  @IncludeInDocumentation
  public static function assignToQueue(queueToAssign : AssignableQueue, activity : Activity) {
    activity.assignActivityToQueue(queueToAssign, queueToAssign.Group)
  }

  /**
   * Will assign the activity to a user in the group by round robin with considerations for
   * the user on vacation.
   * If the user's VacationStatus is ONVACATION, the activity will be assigned to the user's specified Backup User in
   * the Group's Detail
   * Administration -> Group -> Group Detail (click on the name) -> Profile
   *
   * @param activity
   * @param groupToAssign
   */
  @IncludeInDocumentation
  public static function assignUserByRoundRobinWithBackup(activity : Activity, groupToAssign : Group) {
    activity.assignUserByRoundRobin(false, groupToAssign)
    maybeAssignToBackUpUser(activity)
  }

  /**
   * Will attempt to assign the activity to a BackupUser if the AssignedUser is VacationStatusType.TC_ONVACATION.
   * If the AssignedUser is not on vacation or there isn't a defined BackupUser, the activity AssignedUser doesn't change.
   * @param activity the activity to be assigned
   */
  @IncludeInDocumentation
  public static function maybeAssignToBackUpUser(activity : Activity) {
    if (activity.AssignedUser.VacationStatus == TC_ONVACATION and activity.AssignedUser.BackupUser != null) {
      activity.AssignedUser = activity.AssignedUser.BackupUser
    }
  }

}