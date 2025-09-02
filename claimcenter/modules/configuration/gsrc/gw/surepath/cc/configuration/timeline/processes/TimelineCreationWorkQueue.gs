package gw.surepath.cc.configuration.timeline.processes

uses gw.surepath.cc.configuration.timeline.creation.TimelineUtil
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.processes.WorkQueueBase

/**
 *
 * Work queue for the creation of claim timelines.
 */
class TimelineCreationWorkQueue extends WorkQueueBase<Claim, TimeCreationWorkItem_SP>  {

  construct() {
    super(BatchProcessType.TC_CLAIMTIMELINECREATION_SP, TimeCreationWorkItem_SP, Claim)
  }

  /**
   * processWorkItem updates the timeline of the claim associated with the given workItem
   * with timeline entries that are before the timeline's active date by calling TimelineUtil's
   * updateTimeline method.
   * @param workItem a TimelineCreationWorkItem to process
   */
  override function processWorkItem(workItem : TimeCreationWorkItem_SP) {
    var claim = workItem.Claim
    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      claim = bundle.add(claim)
      TimelineUtil.updateTimeline(claim.Timeline_SP.RestoreDate, claim)
      claim.Timeline_SP.TimelineStatus = TimelineStatus_SP.TC_ACTIVE
    })

  }

  /**
   * createWorkItem creates a new TimelineCreationWorkItem associated with the given claim
   * in the given bundle.
   * @param claim Claim for which you would like to update the timeline
   * @param bundle Bundle that you would like to create the work item in.
   * @return a new TimelineCreationWorkItem to update the timeline
   */
  override function createWorkItem(claim : Claim, bundle : Bundle) : TimeCreationWorkItem_SP {
    var workItem = new TimeCreationWorkItem_SP(bundle)
    workItem.Claim = claim
    workItem.initialize()
    return workItem
  }
}