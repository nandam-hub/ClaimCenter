package gw.surepath.cc.configuration.activitymanagement.util

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.surepath.cc.configuration.activitymanagement.api.bcactivityapi.bcactivityapi.BCActivityAPI
uses gw.surepath.cc.configuration.activitymanagement.api.pcactivityapi.pcactivityapi.PCActivityAPI
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Activity Management: This class is used for retrieving activities used in the
 * Cross Suite Activity List Views
 */
@IncludeInDocumentation
class ActivityFinder {

  /**
   * Retrieves activities for the current user from this application
   * Limiting to only those assigned to the user(s) for whom this user is the backup
   * @param user the user whose activities should be viewable
   * @return a query bean result of activities for the given user
   */
  @IncludeInDocumentation
  static function findActivitiesByBackupUser(user: User): IQueryBeanResult<Activity> {
    //query for any user backup entities where this user is the backup user
    var userBackupQuery = Query.make(entity.UserBackup)
    userBackupQuery.compare(entity.UserBackup#BackupUser, Equals, user)
    //query for any activities where this user is the backup user for the assigned user
    var assignedActivityQuery = Query.make(entity.Activity)
    //the assigned user is not the passed in user, but is the user being backed up by the passed in user
    assignedActivityQuery.subselect(entity.Activity#AssignedUser, CompareIn, userBackupQuery, entity.UserBackup#User)
    //now return the result set
    return assignedActivityQuery.select()
  }

  /**
   * Returns the activites for the current user from BillingCenter
   * @return ActivityDTO[] from BillingCenter
   */
  @IncludeInDocumentation
  static function retrieveCrossAppBCActivitiesForCurrentUser(): gw.surepath.cc.configuration.activitymanagement.api.bcactivityapi.bcactivityapi.types.complex.ActivityDTO[] {
    var currentUser = User.util.CurrentUser
    var activities = new BCActivityAPI().retrieveLocalOpenActivitiesForLoggedInUser(currentUser.Credential.UserName)
    return activities
  }

  /**
   * Returns the activites for the current user from PolicyCenter
   * @return ActivityDTO[] from PolicyCenter
   */
  @IncludeInDocumentation
  static function retrieveCrossAppPCActivitiesForCurrentUser(): gw.surepath.cc.configuration.activitymanagement.api.pcactivityapi.pcactivityapi.types.complex.ActivityDTO[] {
    var currentUser = User.util.CurrentUser
    var activities = new PCActivityAPI().retrieveLocalOpenActivitiesForLoggedInUser(currentUser.Credential.UserName)
    return activities
  }

}