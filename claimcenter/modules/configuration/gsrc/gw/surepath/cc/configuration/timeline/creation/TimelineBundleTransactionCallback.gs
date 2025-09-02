package gw.surepath.cc.configuration.timeline.creation

uses gw.pl.persistence.core.Bundle
uses gw.transaction.AbstractBundleTransactionCallback

/**
 * .
 */
class TimelineBundleTransactionCallback extends AbstractBundleTransactionCallback {
  private var _claim : Claim
  public function TimelineBundleTransactionCallback(claim : Claim) {
    _claim = claim
  }
  public override function afterPreUpdate(bundle : Bundle) {
    TimelineUtil.updateTimeline(_claim, bundle)
  }
}