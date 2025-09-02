package gw.surepath.cc.configuration.activitymanagement.upgrade

uses gw.api.database.Query
uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses gw.api.locale.DisplayKey
uses gw.entity.IEntityPropertyInfo
uses gw.surepath.cc.configuration.activitymanagement.util.ActivityManagementProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation


/**
 * After getting the database version from extension properties
 * set any empty queue/group fields on activity patterns
 * to pass validations provided in the activity management feature
 */
@IncludeInDocumentation
class ActivityPatternAssigneeInfoUpgradeTrigger extends AfterUpgradeVersionTrigger {

  /**
   * Passes the data model version number as the constructor to the supertype
   */
  @IncludeInDocumentation
  construct() {
    //TODO: hard-coding database version, please implement based upon your own project version number(s)
    //Currently set to one version greater than the version in extensions.properties
    super(178)
  }

  /**
   * Find activity patterns with no group or assignable queue, and associate them to the default root group
   */
  @IncludeInDocumentation
  override function execute() {
    if (ActivityManagementProperties.INSTANCE.FeatureEnabled) {
      var table = getTable(entity.ActivityPattern)
      var ub = table.update()
      //TODO: Would use script parameter here for default root group, but cannot because script parameter cache not started yet
      //Be sure to update this query to meet your implementation needs
      var group = Query.make(entity.Group)
          .compare(entity.Group#Name, Equals, "Default Root Group").select().FirstResult
      var groupPropertyInfo = ActivityPattern.Type.TypeInfo
          .getProperty(ActivityPattern#Group_SP.PropertyInfo.Name) as IEntityPropertyInfo
      ub.set(groupPropertyInfo, group).getQuery()
          .compare(ActivityPattern#Group_SP, Equals, null)
          .compare(ActivityPattern#AssignableQueue_SP, Equals, null)
      ub.execute()
    }
  }


  /**
   * Gets the description
   * @return
   */
  @IncludeInDocumentation
  override property get Description() : String {
    return DisplayKey.get("SP.ActivityManagement.UpgradeTrigger.ActivityPatternAssigneeInfoUpgradeTrigger")
  }
}