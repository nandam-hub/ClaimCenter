package gw.surepath.cc.configuration.adminaudit.plugin

uses gw.surepath.cc.configuration.adminaudit.util.DataAuditorProperties
uses gw.surepath.cc.configuration.adminaudit.util.DataAuditorUtil
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.preupdate.InsertHandler
uses gw.surepath.suite.integration.preupdate.PreUpdatePriority
uses gw.surepath.suite.integration.preupdate.RemoveHandler
uses gw.surepath.suite.integration.preupdate.UpdateHandler

/**
 * Preupdate handler for the DataAudit feature
 * Inspects beans which may be eligible for auditing and creats an audit record where
 * appropriate
 */
@IncludeInDocumentation
class DataAuditPreupdateHandler implements RemoveHandler<KeyableBean>, UpdateHandler<KeyableBean>, InsertHandler<KeyableBean> {

  private static var _log = StructuredLogger.RULES

  override property get Priority() : PreUpdatePriority {
    return null
  }

  override function executePreUpdate(beans : List<KeyableBean>) {
    if (DataAuditorProperties.INSTANCE.FeatureEnabled) {
      var bundle = beans.first().Bundle
      DataAuditorUtil.getOrCreateCallbackFor(bundle)
    }
  }
}