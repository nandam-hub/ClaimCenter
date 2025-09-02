package gw.surepath.cc.configuration.timeline

uses gw.api.databuilder.*
uses gw.api.system.server.Runlevel
uses gw.api.test.CCServerTestClassBase
uses gw.testharness.RunLevel
uses gw.testharness.TestBase

uses java.lang.System
uses java.util.Calendar
uses java.util.Date
uses java.util.GregorianCalendar

/**
 * Created by schan on 6/19/2015.
 */
@RunLevel(Runlevel.MULTIUSER)
class ClaimPreUpdateTimelineTest extends CCServerTestClassBase {

  function testClaimCreationTimelineLengthIsZero() {
    var claim = ClaimBuilder.auto().createAndCommit()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(0)
  }

  function testClaimTimelineLengthAfterOneNote() {
    var claim = ClaimBuilder.auto().createAndCommit()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(0)
    var note = new NoteBuilder().withSubject("123").onClaim(claim).withAuthoringDate(new Date()).createAndCommit()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(1)
  }

  /**
      function testClaimTimelineLengthAfterOneNoteAndOneDocument(){
      var claim = ClaimBuilder.auto().createAndCommit()
      assertThat(claim.Timeline.TimelineEntries.length).isEqualTo(0)
      var note = new NoteBuilder().withSubject("123").onClaim(claim).withAuthoringDate(new Date()).createAndCommit()
      var doc : Document = new DocumentBuilder().onClaim(claim).create()
      doc.DateCreated = new Date()
      doc.Bundle.commit()
      assertThat(claim.Timeline.TimelineEntries.length).isEqualTo(2)
      }
   */
  function testClaimTimelineLengthAfterThreeCreationsAndTwoCommits() {
    var claim = ClaimBuilder.auto().createAndCommit()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(0)
    var note3 = new NoteBuilder().withSubject("789").onClaim(claim).withAuthoringDate(new Date()).createAndCommit()
    var note2 = new NoteBuilder().withSubject("456").onClaim(claim).withAuthoringDate(new Date()).createAndCommit()
    var note1 = new NoteBuilder().withSubject("123").onClaim(claim).withAuthoringDate(new Date()).create()
    assertThat(claim.Timeline_SP.TimelineEntries.length).isEqualTo(2)

  }

  function testTimelineHasThreeEntriesAfterPreUpdateIsRun() {
    // In order for this test to work, add a rule to the ExposurePreUpdate
    // that adds a note related to the exposure
    var claim = ClaimBuilder.auto().create()
    var exposure = ExposureBuilder.baggage().onClaim(claim)
        .withEmptyIncident().create()
    claim.Bundle.commit()
    exposure.BreakIn = not exposure.BreakIn
    var calendar = new GregorianCalendar()
    calendar.roll(Calendar.YEAR, 4)
    claim.LossDate = calendar.getTime()
    claim.Bundle.commit()

    //assertEquals(3, claim.Timeline.TimelineEntries.length)
  }
}