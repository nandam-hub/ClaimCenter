package gw.surepath.cc.configuration.timeline.creation

uses gw.pl.persistence.core.Bundle
uses gw.transaction.AbstractBundleTransactionCallback

/**
 * .
 */
class TimelineLinkBundleTransactionCallback extends AbstractBundleTransactionCallback {

  public override function afterSetIds(bundle : Bundle) {
    for (b in bundle.getInsertedBeans()) {
      if ((b typeis TimelineLink_SP) && (b.BeanID == null)) {
        b.setConnection()
      }
    }
  }
}