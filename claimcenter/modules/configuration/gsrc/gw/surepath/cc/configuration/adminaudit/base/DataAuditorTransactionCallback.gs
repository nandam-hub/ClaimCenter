package gw.surepath.cc.configuration.adminaudit.base

uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.adminaudit.util.DataAuditorUtil
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.AbstractBundleTransactionCallback

/**
 * Transaction callback to support persisting the Audit Records to the database
 * Within the same bundle containing the effective change
 */
@IncludeInDocumentation
class DataAuditorTransactionCallback extends AbstractBundleTransactionCallback {

  private static var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.DisplayName)

  /**
   * WARNING: this hooks in *very* late in the bundle commit process. Be very, very careful what kinds of code you
   * put in here. Guidewire has reviewed this code. Refrain from adding additional code.
   */
  @IncludeInDocumentation
  override function afterSearchDenormObjects(bundle: Bundle) {
    super.afterSearchDenormObjects(bundle)
    DataAuditorUtil.maybeAuditBeans(bundle)
  }
}