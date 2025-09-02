package gw.surepath.cc.configuration.activitymanagement.preupdate

uses gw.surepath.cc.configuration.activitymanagement.api.bcactivityapi.bcactivityapi.BCActivityAPI
uses gw.surepath.cc.configuration.activitymanagement.api.pcactivityapi.pcactivityapi.PCActivityAPI
uses gw.surepath.cc.configuration.activitymanagement.util.ActivityManagementProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.preupdate.InsertHandler
uses gw.surepath.suite.integration.preupdate.PreUpdatePriority
uses gw.surepath.suite.integration.preupdate.RemoveHandler
uses gw.surepath.suite.integration.preupdate.UpdateHandler

/**
 * Activity Management: Preupdate handler for CrossAppActPattern_SP
 */
@IncludeInDocumentation
class CrossAppActPattern_SPPreupdate implements RemoveHandler<CrossAppActPattern_SP>, UpdateHandler<CrossAppActPattern_SP>, InsertHandler<CrossAppActPattern_SP> {

  private static var _log = StructuredLogger.CONFIG.createSubcategoryLogger(CrossAppActPattern_SP.DisplayName)

  /**
   * Property for Priority only returns null
   * @return null
   */
  @IncludeInDocumentation
  override property get Priority() : PreUpdatePriority {
    return null
  }

  /**
   *  Implementation of pre-update logic for CrossAppActPattern_SP entity
   *  Any exception will cause the bounding database
   *  transaction to roll back, effectively vetoing the update.
   * @param beans - The relevant beans of List<CrossAppActPattern_SP>
   */
  @IncludeInDocumentation
  override function executePreUpdate(beans : List<CrossAppActPattern_SP>) {
    if (ActivityManagementProperties.INSTANCE.FeatureEnabled and ActivityManagementProperties.INSTANCE.SharedActivitiesEnabled) {
      var bcCrossAppPatterns = beans.where(\elt -> elt.DestinationApplication == TC_BILLINGCENTER)
      var pcCrossAppPatterns = beans.where(\elt -> elt.DestinationApplication == TC_POLICYCENTER)
      if (bcCrossAppPatterns.HasElements) {
        var bcActivityAPI = new BCActivityAPI()
        for (eachPattern in bcCrossAppPatterns) {
          var correspondingPatternExists = bcActivityAPI.correspondingActivityPatternExists(eachPattern.PatternCode, eachPattern.PatternDisplayName, CrossAppActivityDest_SP.TC_CLAIMCENTER.Code)
          if (not eachPattern.Retired and not correspondingPatternExists) {
            _log.warn("Cannot create or update a cross-application activity that does not have a matching record in the destination application! Please add to that application first",
                CrossAppActPattern_SPPreupdate#executePreUpdate(List<CrossAppActPattern_SP>))
            throw new IllegalStateException("Cannot create or update a cross-application activity that does not have a matching record in the destination application! Please add to that application first")
          }
        }
      } else if (pcCrossAppPatterns.HasElements) {
        var pcActivityAPI = new PCActivityAPI()
        for (eachPattern in pcCrossAppPatterns) {
          var correspondingPatternExists = pcActivityAPI.correspondingActivityPatternExists(eachPattern.PatternCode, eachPattern.PatternDisplayName, CrossAppActivityDest_SP.TC_CLAIMCENTER.Code)
          if (not eachPattern.Retired and not correspondingPatternExists) {
            _log.warn("Cannot create or update a cross-application activity that does not have a matching record in the destination application! Please add to that application first",
                CrossAppActPattern_SPPreupdate#executePreUpdate(List<CrossAppActPattern_SP>))
            throw new IllegalStateException("Cannot create or update a cross-application activity that does not have a matching record in the destination application! Please add to that application first")
          }
        }
      }
    }
  }

}