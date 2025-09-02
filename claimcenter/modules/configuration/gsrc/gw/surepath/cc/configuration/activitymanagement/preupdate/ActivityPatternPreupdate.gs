package gw.surepath.cc.configuration.activitymanagement.preupdate

uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.activitymanagement.api.ActivityAPIUtil
uses gw.surepath.cc.configuration.activitymanagement.plugin.CrossAppActivityTransport
uses gw.surepath.cc.configuration.activitymanagement.util.ActivityManagementProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.preupdate.InsertHandler
uses gw.surepath.suite.integration.preupdate.PreUpdatePriority
uses gw.surepath.suite.integration.preupdate.RemoveHandler
uses gw.surepath.suite.integration.preupdate.UpdateHandler

/**
 * Activity Management: Preupdate handler for ActivityPattern
 */
@IncludeInDocumentation
class ActivityPatternPreupdate implements RemoveHandler<ActivityPattern>, UpdateHandler<ActivityPattern>, InsertHandler<ActivityPattern> {

  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(DisplayKey.get("SP.ActivityManagement.Logger.SharedActivities"))

  /**
   * Property for Priority only returns null
   * @return null
   */
  @IncludeInDocumentation
  override property get Priority() : PreUpdatePriority {
    return null
  }

  /**
   *  Implementation of pre-update logic for ActivityPattern entity
   *  Any exception will cause the bounding database
   *  transaction to roll back, effectively vetoing the update.
   * @param beans - The relevant beans of List<ActivityPattern>
   */
  @IncludeInDocumentation
  override function executePreUpdate(beans : List<ActivityPattern>) {
    for (eachPattern in beans) {
      if (ActivityManagementProperties.INSTANCE.FeatureEnabled) {
        handleCrossSuiteActivityPattern(eachPattern)
        handleBootstrapActivityPatternCreation(eachPattern)
      }
    }
  }

  /**
   * Handles changes to the ActivityPattern
   * @param eachPattern
   */
  @IncludeInDocumentation
  private function handleCrossSuiteActivityPattern(eachPattern: ActivityPattern) {
    if (eachPattern.New) {
      if (eachPattern.PCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_PC_ACTPATTERN_ADDED_SP)
      }
      if (eachPattern.New and eachPattern.BCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_BC_ACTPATTERN_ADDED_SP)
      }
    } else if (eachPattern.Retired) {
      if (eachPattern.PCGenerationAllowed_SP) {
        new ActivityAPIUtil().handleRemovedActivityPattern(eachPattern.Code, true, false)
      }
      if (eachPattern.BCGenerationAllowed_SP) {
        new ActivityAPIUtil().handleRemovedActivityPattern(eachPattern.Code, false, true)
      }
    } else if (not eachPattern.New and not eachPattern.Retired) {
      if (eachPattern.isFieldChanged(ActivityPattern#PCGenerationAllowed_SP) and eachPattern.PCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_PC_ACTPATTERN_ADDED_SP)
      } else if (eachPattern.getOriginalValue(ActivityPattern#PCGenerationAllowed_SP) == true and not eachPattern.PCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_PC_ACTPATTERN_REMOVED_SP)
      } else if (eachPattern.PCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_PC_ACTPATTERN_UPDATED_SP)
      }

      if (eachPattern.isFieldChanged(ActivityPattern#BCGenerationAllowed_SP) and eachPattern.BCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_BC_ACTPATTERN_ADDED_SP)
      } else if (eachPattern.getOriginalValue(ActivityPattern#BCGenerationAllowed_SP) == true and not eachPattern.BCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_BC_ACTPATTERN_REMOVED_SP)
      } else if (eachPattern.BCGenerationAllowed_SP) {
        eachPattern.addEvent(CrossAppActivityTransport.EVENT_BC_ACTPATTERN_UPDATED_SP)
      }
    }
  }

  /**
   * Handles Bootstrap ActivityPattern Creation
   * @param eachPattern
   */
  @IncludeInDocumentation
  private function handleBootstrapActivityPatternCreation(eachPattern: ActivityPattern) {
    if (User.util.CurrentUser == null and User.util.UnrestrictedUser == null and
        eachPattern.New and eachPattern.Group_SP == null and eachPattern.AssignableQueue_SP == null) {
      eachPattern.Group_SP = Query.make(entity.Group)
          .compare(entity.Group#Name, Equals, ScriptParameters.DefaultRootGroup_SP).select().FirstResult
    }
  }

}