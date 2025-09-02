package gw.surepath.cc.configuration.activitymanagement.preupdate

uses gw.surepath.cc.configuration.activitymanagement.util.ActivityManagementProperties
uses gw.surepath.cc.configuration.activitymanagement.util.AssignActivitiesUtil
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.preupdate.InsertHandler
uses gw.surepath.suite.integration.preupdate.PreUpdatePriority
uses gw.surepath.suite.integration.preupdate.RemoveHandler
uses gw.surepath.suite.integration.preupdate.UpdateHandler

/**
 * Activity Management: pre-update handler implementation for activity entity
 */
@IncludeInDocumentation
class ActivityPreupdate implements RemoveHandler<Activity>, UpdateHandler<Activity>, InsertHandler<Activity> {

  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(Activity.DisplayName)

  /**
   * Property for Priority only returns null
   *
   * @return null
   */
  @IncludeInDocumentation
  override property get Priority() : PreUpdatePriority {
    return null
  }

  /**
   * Implementation of pre-update logic for ActivityPattern entity
   * Any exception will cause the bounding database
   * transaction to roll back, effectively vetoing the update.
   *
   * @param beans - The relevant beans of List<Activity>
   */
  @IncludeInDocumentation
  override function executePreUpdate(beans : List<Activity>) {
    for (eachActivity in beans) {
      if (ActivityManagementProperties.INSTANCE.BackupUserEnabled) {
        if (eachActivity.New) {
          //if its new, check the assignment
          AssignActivitiesUtil.maybeAssignToBackUpUser(eachActivity)
        } else {
          //it its not new, check if the assignment has changed
          if (eachActivity.isFieldChanged(Activity#AssignedUser)) {
            AssignActivitiesUtil.maybeAssignToBackUpUser(eachActivity)
          }
        }
      }
    }
  }


}