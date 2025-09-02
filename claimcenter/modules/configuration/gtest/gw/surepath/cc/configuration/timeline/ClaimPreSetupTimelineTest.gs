package gw.surepath.cc.configuration.timeline

uses gw.api.databuilder.ClaimBuilder
uses gw.api.system.server.Runlevel
uses gw.api.test.CCServerTestClassBase
uses gw.testharness.RunLevel
uses gw.testharness.TestBase

/**
 * Created by schan on 6/19/2015.
 */
@RunLevel(Runlevel.MULTIUSER)
class ClaimPreSetupTimelineTest extends CCServerTestClassBase {

  function testPreSetupNonNullTimeline() {

    var claim = ClaimBuilder.auto().createAndCommit()
    assertThat(claim.Timeline_SP).isNotEqualTo(null)
  }

  function testPreSetupEmptyTimeline(){
    var claim = ClaimBuilder.auto().createAndCommit()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(0)

  }


}