package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Queries
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.ArrayList
uses java.util.Date

/**
 * Generate timeline entries for notes. Creates entries when a new note is created, updated or deleted.
 *
 */
@IncludeInDocumentation
class NoteTimelineEntryGenerator implements TimelineEntryGenerator {

  /**
   * Queries the database and returns all Notes that are attached to the claim
   * CLAIM. If DATE is not null, this method queries for notes with AuthoringDates
   * before the date DATE.
   * The notes returned from the DB are processed and used to create Timeline Entries.
   * @param claim
   * @param date
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var notes : IQueryBeanResult<Note> = null
    if (date == null) {
      notes = Queries.createQuery<Note>(Note)
          .compare(Note#Claim, Relop.Equals, claim)
          .withFindRetired(true)
          .select()
    } else {
      notes = Queries.createQuery<Note>(Note)
          .compare(Note#Claim, Relop.Equals, claim)
          .compare(Note#AuthoringDate, Relop.LessThan, date)
          .withFindRetired(true)
          .select()
    }
    var retList = new ArrayList<TimelineEntry_SP>()
    for (note in notes) {
      retList.add(generateNoteEntry(note, claim.Bundle, true))
      if (note.Retired) {
        retList.add(generateNoteEntry(note, claim.Bundle, false))
      }
    }
    return retList
  }

  /**
   * Looks for newly created Notes in bundle BUNDLE with claim CLAIM and produces
   * Timeline Entries for CLAIM.
   * @param bundle
   * @param claim
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(bundle : Bundle, claim: Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    for (bean in bundle.InsertedBeans) {
      if ((bean typeis Note) && (bean.Claim == claim) && (bean.New)) {
        retEntries.add(generateNoteEntry(bean as Note, bundle, true))
      }
    }
    for (bean in bundle.RemovedBeans) {
      if ((bean typeis Note) && (bean.Claim == claim) && (!bean.New)) {
        retEntries.add(generateNoteEntry(bean as Note, bundle, false))
      }
    }
    return retEntries
  }

  /**
   * Takes in a note NOTE, bundle BUNDLE, and boolean CREATE and returns a TimelineEntry with
   * with associated notes. If CREATE == true, we create a creation timeline entry. If not, we
   * create a deletion entry.
   * @param note
   * @param bundle
   * @param create
   * @return
   */
  @IncludeInDocumentation
  function generateNoteEntry(note : Note, bundle : Bundle, create : boolean) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    var date = create ? note.AuthoringDate : note.UpdateTime
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_NOTES
    var user = create ? note.Author : note.UpdateUser
    var subject = note.Subject != null ? note.Subject : ""

    entry.Summary = DisplayKey.get(create ? "SP.Timeline.Summary.Note.Created"
        : "SP.Timeline.Summary.Note.Deleted", {
        note.Topic,
        subject,
        user.DisplayName})

    entry.Importance = create ? TimelineImportance_SP.TC_HIGH : TimelineImportance_SP.TC_MEDIUM

    var noteLink = new TimelineLink_SP(bundle)
    noteLink.Sequence = 0
    noteLink.Bean = note
    entry.addToTimelineLinks(noteLink)
    if (user != null) {
      var userLink = new TimelineLink_SP(bundle)
      userLink.Sequence = 1
      userLink.Bean = user
      entry.addToTimelineLinks(userLink)
    }
    var related = note.RelatedTo
    if ((related != null) && !(related typeis Claim)) {
      var relatedLink = new TimelineLink_SP(bundle)
      relatedLink.Bean = related as KeyableBean
      entry.addToTimelineLinks(relatedLink)
    }

    var serviceRequest = note.ServiceRequest
    if (serviceRequest != null) {
      var serviceRequestLink = new TimelineLink_SP(bundle)
      serviceRequestLink.Bean = serviceRequest as KeyableBean
      entry.addToTimelineLinks(serviceRequestLink)
    }

    var matter = note.Matter
    if (matter != null) {
      var matterLink = new TimelineLink_SP(bundle)
      matterLink.Bean = matter as KeyableBean
      entry.addToTimelineLinks(matterLink)
    }

    if (!create) {
      entry.EventDate = DateUtil.currentDate()
      entry.removeLink(0)
      var claimTimelineEntries = note.Claim.Timeline_SP.TimelineEntries
      var noteLinks = new java.util.ArrayList<TimelineLink_SP>()
      claimTimelineEntries.each( \ elt -> {
        var resultsToAdd = elt.TimelineLinks
            .where(\aLink -> aLink.BeanType == "entity.Note" && aLink.BeanID == note.PublicID)
        noteLinks.addAll(resultsToAdd.toList())
      })


      // Remove note link from timeline entry since note is no longer available
      noteLinks.each( \ elt -> elt.TimelineEntry.removeLink(0))
    }

    return entry
  }
}
