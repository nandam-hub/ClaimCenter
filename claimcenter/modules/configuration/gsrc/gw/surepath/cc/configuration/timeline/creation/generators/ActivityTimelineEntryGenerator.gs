package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.*

uses gw.api.locale.DisplayKey
uses gw.surepath.cc.configuration.timeline.creation.TimelineArbitraryLinkEnum
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.text.DateFormat
uses java.util.ArrayList
uses java.util.Collection
uses java.util.Date

/**
 * Generate timeline entries for activities. Adds links for the activities in the claim timeline,
 * generates entries for the reassigned, completed or skipped activities
 */
@IncludeInDocumentation
class  ActivityTimelineEntryGenerator implements TimelineEntryGenerator {
  /**
   * generateEntries generates TimelineEntries for Activity assignment,
   * escalation, and close date for the given claim before the given Date.
   * If null is passed in instead of a Date object, then generateEntries
   * will generate TimelineEntries for all Activity assignment,
   * escalation, and close date events.
   * @param claim Claim you wish to create Timeline events for its Activities
   * @param date Date before which you would like to look for Activity events
   * @return List<TimelineEntry> of newly created TimelineEntries
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var activityList : IQueryBeanResult<Activity> = null
    if (date == null) {
      activityList = Queries.createQuery<Activity>(Activity)
          .compare(Activity#Claim, Relop.Equals, claim)
          .or(\activityRestriction -> activityRestriction
              .compare(Activity#Status, Relop.Equals, ActivityStatus.TC_COMPLETE)
              .compare(Activity#Status, Relop.Equals, ActivityStatus.TC_SKIPPED)
              .compare(Activity#AssignedByUser, Relop.NotEquals, null))
          .select()
    } else {
      activityList = Queries.createQuery<Activity>(Activity)
          .compare(Activity#Claim, Relop.Equals, claim)
          .or(\activityRestriction -> {
            activityRestriction.and(\activityRestrictionClosed -> activityRestrictionClosed.compare(Activity#Status, Relop.Equals, ActivityStatus.TC_COMPLETE)
                .compare(Activity#CloseDate, Relop.LessThan, date));
            activityRestriction.and(\activityRestrictionSkipped -> activityRestrictionSkipped.compare(Activity#Status, Relop.Equals, ActivityStatus.TC_SKIPPED)
                .compare(Activity#CloseDate, Relop.LessThan, date));
            activityRestriction.and(\activityRestrictionReassign -> activityRestrictionReassign.compare(Activity#PreviousUser, Relop.NotEquals, null)
                .compare(Activity#AssignmentDate, Relop.LessThan, date))
          })
          .select()
    }
    var bundle = claim.Bundle
    var retList = new ArrayList<TimelineEntry_SP>()
    for (activity in activityList) {
      if ((date == null) || (activity.CloseDate < date)) {
        if (activity.Status == ActivityStatus.TC_SKIPPED) {
          retList.add(generateCompletedOrSkippedEntries(activity,
              bundle,
              activity.CloseDate,
              "SP.Timeline.Summary.Activity.Skipped"))
        }
        if (activity.Status == ActivityStatus.TC_COMPLETE) {
          retList.add(generateCompletedOrSkippedEntries(activity,
              bundle,
              activity.CloseDate,
              "SP.Timeline.Summary.Activity.Completed"))
        }
      }
      var assignmentDate = activity.AssignmentDate
      if ((activity.PreviousUser != null)  && ((date == null) || (assignmentDate < date))) {
        retList.add(generateReassignedEntry(activity, bundle, assignmentDate))

      }
    }
    return retList
  }


  /**
   * generateEntries finds newly created and updated Activities in the given bundle
   * and associated with the given claim and creates TimelineEntries for the
   * AssignmentDate, EscalationDate, and CloseDate if these fields are new or changed.
   *
   * This function only creates TimelineEntries for Activity changes that have not
   * been committed to the database yet.
   *
   * It is assumed that the bundle passed in is the claim's bundle.
   * @param bundle Bundle in which you wish search for updated or newly created Activities
   *               to create TimelineEntries for them
   * @param claim Claim you wish to find Activities for
   * @return List<TimelineEntry> of newly created TimelineEntries
   */
  @IncludeInDocumentation
  public function generateEntries(bundle: Bundle, claim: Claim) : List<TimelineEntry_SP> {
    var retList = new ArrayList<TimelineEntry_SP>()
    for (activity in bundle.InsertedAndUpdatedBeans
        .where(\b -> ((b typeis Activity) && (b.Claim == claim))) as Collection<Activity>) {
      if (activity.isFieldChanged(Activity#Status)) {
        if (activity.Status == ActivityStatus.TC_SKIPPED) {
          retList.add(generateCompletedOrSkippedEntries(activity,
              bundle,
              activity.CloseDate,
              "SP.Timeline.Summary.Activity.Skipped"))
        }
        if (activity.Status == ActivityStatus.TC_COMPLETE) {
          retList.add(generateCompletedOrSkippedEntries(activity,
              bundle,
              activity.CloseDate,
              "SP.Timeline.Summary.Activity.Completed"))
        }
      }
      if (activity.isFieldChanged(Activity#AssignedUser) && (activity.PreviousUser != null)) {
        retList.add(generateReassignedEntry(activity, bundle, activity.AssignmentDate))
      }
    }

    return retList
  }

  function generateCompletedOrSkippedEntries(activity : Activity, bundle : Bundle, date : Date, key : String) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_ACTIVITIES
    var formattedDate : String
    if (activity.TargetDate != null) {
      formattedDate = DateFormat.getDateInstance(DateFormat.SHORT).format(activity.TargetDate)
    }
    entry.Summary = DisplayKey.get(key,
        new Object[]{activity.Subject,
        formattedDate,
        activity.CloseUser})
    entry.Importance = TimelineImportance_SP.TC_MEDIUM
    addLinks(activity, entry, bundle, false)
    generateAssociatedLinksAndString(activity, entry, bundle, 2)
    return entry
  }

  function generateReassignedEntry(activity : Activity, bundle : Bundle, date : Date) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_ACTIVITIES
    entry.Importance = TimelineImportance_SP.TC_LOW
    var formattedDate : String
    if (activity.TargetDate != null) {
      formattedDate = DateFormat.getDateInstance(DateFormat.SHORT).format(activity.TargetDate)
    }
    entry.Summary = DisplayKey.get("SP.Timeline.Summary.Activity.Reassigned",
        {activity.Subject,
        formattedDate,
        activity.AssignedByUser,
        activity.AssignedUser})
    addLinks(activity, entry, bundle, true)
    generateAssociatedLinksAndString(activity, entry, bundle, 3)
    return entry
  }

  function addLinks(activity : Activity, entry : TimelineEntry_SP, bundle : Bundle, reassign : boolean) {
    var activityLink = new TimelineLink_SP(bundle)
    activityLink.Sequence = 0
    activityLink.Bean = activity
    entry.addToTimelineLinks(activityLink)
    if (reassign) {
      var assigner = activity.AssignedByUser
      if (assigner != null) {
        var assignerLink = new TimelineLink_SP(bundle)
        assignerLink.Sequence = 1
        assignerLink.Bean = assigner
        entry.addToTimelineLinks(assignerLink)
      }
      var assignee = activity.AssignedUser
      if (assignee != null) {
        var assigneeLink = new TimelineLink_SP(bundle)
        assigneeLink.Sequence = 2
        assigneeLink.Bean = assignee
        entry.addToTimelineLinks(assigneeLink)
      }

    } else {
      var user = activity.CloseUser
      if (user != null) {
        var userLink = new TimelineLink_SP(bundle)
        userLink.Sequence = 1
        userLink.Bean = user
        entry.addToTimelineLinks(userLink)
      }
    }
  }

  function generateAssociatedLinksAndString(activity : Activity, entry : TimelineEntry_SP, bundle : Bundle, seq : int) {

    var hasDocuments = activity.getLinkedDocuments().HasElements
    var hasNotes = Queries.createQuery<Note>(Note)
        .compare(Note#Activity, Relop.Equals, activity)
        .select()
        .HasElements
    if (hasDocuments && hasNotes) {
      entry.Summary += (" " + DisplayKey.get("SP.Timeline.Summary.Activity.Associated.NotesAndDocuments", {seq, seq + 1}))

      var noteLink = new TimelineLink_SP(bundle)
      noteLink.Sequence = seq
      noteLink.Bean = activity
      noteLink.ArbitraryLinkEnum = TimelineArbitraryLinkEnum.activity_notes.Code
      entry.addToTimelineLinks(noteLink)
      var docLink = new TimelineLink_SP(bundle)
      docLink.Sequence = seq + 1
      docLink.Bean = activity
      entry.addToTimelineLinks(docLink)

    } else if (hasDocuments && !hasNotes) {
      entry.Summary += (" " + DisplayKey.get("SP.Timeline.Summary.Activity.Associated.Documents", new Object[]{seq}))

      var docLink = new TimelineLink_SP(bundle)
      docLink.Sequence = seq
      docLink.Bean = activity
      entry.addToTimelineLinks(docLink)

    } else if (!hasDocuments && hasNotes) {
      entry.Summary += (" " + DisplayKey.get("SP.Timeline.Summary.Activity.Associated.Notes", new Object[]{seq}))

      var noteLink = new TimelineLink_SP(bundle)
      noteLink.Sequence = seq
      noteLink.Bean = activity
      noteLink.ArbitraryLinkEnum = TimelineArbitraryLinkEnum.activity_notes.Code
      entry.addToTimelineLinks(noteLink)
    }

    var matter = activity.Matter
    if (matter != null) {
      var matterLink = new TimelineLink_SP(bundle)
      matterLink.Bean = matter
      entry.addToTimelineLinks(matterLink)
    }

    var exposure = activity.Exposure
    if (exposure != null) {
      var exposureLink = new TimelineLink_SP(bundle)
      exposureLink.Bean = exposure
      entry.addToTimelineLinks(exposureLink)
    }

    var serviceRequest = activity.ServiceRequest
    if (serviceRequest != null) {
      var serviceRequestLink = new TimelineLink_SP(bundle)
      serviceRequestLink.Bean = serviceRequest
      entry.addToTimelineLinks(serviceRequestLink)
    }

    var contact = activity.ClaimContact.Contact
    if (contact != null) {
      var contactLink = new TimelineLink_SP(bundle)
      contactLink.Bean = contact
      entry.addToTimelineLinks(contactLink)
    }
  }
}
