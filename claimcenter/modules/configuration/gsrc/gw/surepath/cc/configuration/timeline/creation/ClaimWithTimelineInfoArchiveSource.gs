package gw.surepath.cc.configuration.timeline.creation

uses gw.plugin.archiving.ClaimInfoArchiveSource

/**
 * .
 */
class ClaimWithTimelineInfoArchiveSource extends ClaimInfoArchiveSource {
  override function updateInfoOnStore(info : RootInfo) {
    super.updateInfoOnStore(info)
    TimelineUtil.cleanTimeline((info as ClaimInfo).Claim)
  }
}