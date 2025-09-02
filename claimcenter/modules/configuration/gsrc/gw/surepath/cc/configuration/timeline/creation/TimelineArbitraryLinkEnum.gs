package gw.surepath.cc.configuration.timeline.creation

/**
 * .
 */
enum TimelineArbitraryLinkEnum {

  activity_notes(\claim, bean -> pcf.ActivityNotesPage.go(claim, bean as Activity)),

  private var _block : block(claim : Claim, bean : KeyableBean)

  private construct(b : block(claim : Claim, bean : KeyableBean)) {
    _block = b
  }

  public function goToPage(claim : Claim, bean : KeyableBean) {
    _block(claim, bean)
  }

}