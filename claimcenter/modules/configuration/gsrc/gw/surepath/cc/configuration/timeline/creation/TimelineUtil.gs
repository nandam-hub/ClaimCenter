package gw.surepath.cc.configuration.timeline.creation

//uses gw.api.database.Queries

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bean
uses gw.pl.persistence.core.Bundle
uses gw.surepath.cc.configuration.timeline.creation.generators.ActivityTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.CheckTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.DocumentTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.NoteTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.RecoveryReserveTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.RecoveryTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.ReserveTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.ServiceRequestHistoryTimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.creation.generators.TimelineEntryGenerator
uses gw.surepath.cc.configuration.timeline.processes.TimelineCreationWorkQueue
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * This is the utility class for the Claim Timeline feature
 * The utility methods includes to get the timeline entries based on the Claim and the date,
 * creating a timeline work item for the claim and also updating the generated timeline.
 * Also has methods used to clean the timeline status for claims and handle the timeline event types
 * based on the entries in the timeline event administration page.
 *
 */
@IncludeInDocumentation
class TimelineUtil {

  static var _generators: List<TimelineEntryGenerator> = new ArrayList<TimelineEntryGenerator>() {
    new ActivityTimelineEntryGenerator(),
    new CheckTimelineEntryGenerator(),
    new DocumentTimelineEntryGenerator(),
    new NoteTimelineEntryGenerator(),
    new RecoveryTimelineEntryGenerator(),
    new RecoveryReserveTimelineEntryGenerator(),
    new ReserveTimelineEntryGenerator(),
    new ServiceRequestHistoryTimelineEntryGenerator()

  }

  /**
   * Gets all the Timeline Entries for the provided claim and the date
   * It executes for all the generators selected for the timeline filter and returns the
   * list of entities based on the filter.
   * @param claim
   * @param date
   * @return TimelineEntry_SP
   */
  @IncludeInDocumentation
  static function getTimelineEntries(claim: Claim, date: Date) : TimelineEntry_SP[] {
    var entries = new ArrayList<TimelineEntry_SP>()
    for (s in _generators) {
      entries.addAll(s.generateEntries(claim, date))
    }
    return entries.toTypedArray()
  }

  static function getTimelineEntriesBeforeDate(claim: Claim, date: Date) : TimelineEntry_SP[] {
    return getTimelineEntries(claim, date)
  }

  static function getTimelineEntries(claim: Claim) : TimelineEntry_SP[] {
    return getTimelineEntries(claim, null)
  }

  static function getTimelineEntriesForCurrentUpdate(claim : Claim, bundle : Bundle) : TimelineEntry_SP[] {
    var entries = new ArrayList<TimelineEntry_SP>()
    for (s in _generators) {
      entries.addAll(s.generateEntries(bundle, claim))
    }
    return entries.toTypedArray()
  }

  static function createTimelineCreationWorkItem(claim : Claim, bundle : Bundle) {
    if (claim.Timeline_SP.TimelineStatus != TimelineStatus_SP.TC_RESTORING) {
      claim.Timeline_SP.TimelineStatus = TimelineStatus_SP.TC_RESTORING
      new TimelineCreationWorkQueue().createWorkItem(claim, bundle)
      if (claim.Timeline_SP == null) {
        claim.Timeline_SP = new Timeline_SP(bundle)
      }
    }
  }

  static function updateTimeline(claim : Claim, bundle : Bundle) {
    if (claim.Timeline_SP == null) {
      claim.Timeline_SP = new Timeline_SP(bundle)
    }
    var timeline = claim.Timeline_SP

    var restore = false
    if (timeline.New) {
      if (claim.New) {
        timeline.TimelineStatus = TimelineStatus_SP.TC_ACTIVE
      } else if (claim.State != ClaimState.TC_DRAFT) {
        restore = true
      }
    } else {
      if (timeline.TimelineStatus == TimelineStatus_SP.TC_CLEANED) {
        restore = true
      }
    }
    if ((timeline.TimelineStatus == TimelineStatus_SP.TC_ACTIVE) || (!User.util.CurrentUser.isSystemUser())) {
      if (!timeline.isFieldChanged(Timeline_SP#TimelineEntries)) {
        bundle.addBundleTransactionCallback(new TimelineLinkBundleTransactionCallback())
        var entries = getTimelineEntriesForCurrentUpdate(claim, bundle)
        if (restore) {
          for (e in entries) {
            e.PossibleDuplicate = true
            claim.Timeline_SP.addToTimelineEntries(e)
          }
        } else {
          for (e in entries) {
            claim.Timeline_SP.addToTimelineEntries(e)
          }
        }
      }
      if (restore) {
        createTimelineCreationWorkItem(claim, bundle)
      }
    }
  }

  /**
   * When the timeline for a claim is updated this method updates the timeline with the date and
   * the value that is used to update the timeline
   * @param date The date when it's updated
   * @param claim The affected claim
   */
  @IncludeInDocumentation
  static function updateTimeline(date : Date, claim : Claim) {
    if (claim.Timeline_SP == null) {
      claim.Timeline_SP = new Timeline_SP(claim.Bundle)
    }
    var timeline = claim.Timeline_SP
    var bundle = claim.Bundle
    bundle.addBundleTransactionCallback(new TimelineLinkBundleTransactionCallback())
    //var possibleDuplicates = Queries.createQuery<TimelineEntry_SP>(TimelineEntry_SP)
    var possibleDuplicates = Query.make(TimelineEntry_SP)
      .compare(TimelineEntry_SP#Timeline, Relop.Equals, timeline)
      .compare(TimelineEntry_SP#PossibleDuplicate, Relop.Equals, true)
      .select()
      .orderByDescending(QuerySelectColumns.path(Paths.make(TimelineEntry_SP#EventDate)))
      .toList()
    var i = 0
    for (entry in getTimelineEntries(claim, date).sortByDescending(\e -> e.EventDate)) {
      var currDate = entry.EventDate
      if (i < possibleDuplicates.size()) {
        while ((i < possibleDuplicates.size()) && (possibleDuplicates[i].EventDate > currDate)) {
          bundle.add(possibleDuplicates[i]).PossibleDuplicate = false
          i += 1
        }
        if ((i == possibleDuplicates.size()) || (possibleDuplicates[i].EventDate < currDate)) {
          timeline.addToTimelineEntries(entry)
          continue
        }
        if ((i < possibleDuplicates.size()) && (possibleDuplicates[i].EventDate == currDate)) {
          var s = 0
          var check = true
          while (((i + s) < possibleDuplicates.size()) && (possibleDuplicates[i + s].EventDate == currDate)) {
            check &&= (!possibleDuplicates[i + s].isEqualTo(entry))
            s += 1
          }
          if (check) {
            timeline.addToTimelineEntries(entry)
            continue
          } else {
            entry.remove()
            continue
          }
        } else {
          entry.remove()
          continue
        }
      } else {
        timeline.addToTimelineEntries(entry)
        continue
      }
    }
    if (timeline.RestoreDate == null) {
      timeline.RestoreDate = DateUtil.currentDate()
    }
  }

  static function cleanTimeline(claim : Claim, numberOfKeptEntries : int = 0) {
    if (claim.Timeline_SP != null) {
      var timeline = claim.Timeline_SP
      var timelineEntries = claim.Timeline_SP.TimelineEntries.orderByDescending(\entry -> entry.EventDate)
      var numEntries = timelineEntries.size()
      if (numEntries <= numberOfKeptEntries) {
        timeline.TimelineStatus = TimelineStatus_SP.TC_CLEANED
        if (claim.Timeline_SP.TimelineEntries.HasElements) {
          timeline.RestoreDate = claim.Timeline_SP.TimelineEntries.sortBy(\e -> e.EventDate).first().EventDate
        } else {
          timeline.RestoreDate = null
        }
        return
      }
      if (numberOfKeptEntries == 0) {
        while (timeline.TimelineEntries.HasElements) {
          timeline.TimelineEntries[0].remove()
        }
      } else {
        var firstDeleteIndex = numberOfKeptEntries
        while ((firstDeleteIndex + 1 < numEntries)
            && (timelineEntries[firstDeleteIndex].EventDate == timelineEntries[firstDeleteIndex + 1].EventDate)) {
          firstDeleteIndex += 1
        }
        if (timelineEntries[firstDeleteIndex].EventDate != timelineEntries[firstDeleteIndex - 1].EventDate) {
          var currentDeleteIndex = firstDeleteIndex
          while (currentDeleteIndex < timelineEntries.size()) {
            timelineEntries[currentDeleteIndex].remove()
            currentDeleteIndex += 1
          }
        }
      }
      timeline.TimelineStatus = TimelineStatus_SP.TC_CLEANED
      if (numberOfKeptEntries > 0) {
        timeline.RestoreDate = timelineEntries.last().EventDate
      } else {
        timeline.RestoreDate = null
      }
    }
  }

  static function onTimelineView(claim: Claim) {
    if ((claim.Timeline_SP == null)
        || (claim.Timeline_SP.TimelineStatus == TimelineStatus_SP.TC_CLEANED)
        || (claim.Timeline_SP.New)) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        claim = bundle.add(claim)
        if (claim.Timeline_SP == null) {
          claim.Timeline_SP = new Timeline_SP(bundle)
        }
        createTimelineCreationWorkItem(claim, bundle)
      })
    }
  }

  static function registerCallback(claim: Claim, bundle: Bundle) {
    bundle.addBundleTransactionCallback(new TimelineBundleTransactionCallback(claim))
  }

  public static function findByPublicId(entityType : Type, publicId : String) : Bean {
    //var beanQuery = Queries.createQuery(entityType);
    var beanQuery = Query.make(entityType)
    beanQuery.compare(KeyableBean.PUBLICID_DYNPROP.get(entityType), Relop.Equals, publicId);
    return beanQuery.select().getAtMostOneRow();
  }

  public static function createLinkTag(seq : int, link : String) : String {
    return "<#" + seq + "%" + link + "%>"
  }

  /**
   * This function returns all the Timeline Event Types entered in the Administration page of the Timeline event
   * It also compares the effective date and the expiration date with today's date and
   * returns the matching time line event types which would be used in the claim timeline screen
   * @return Set of TimelineCategory_SP
   */
@IncludeInDocumentation

  static function timelineEventValues() : java.util.Set<TimelineCategory_SP> {
    var timeLineEventQuery =  gw.api.database.Query.make(TimelineEvent_SP)
   //restrict on effective date
    timeLineEventQuery.compare("EffectiveDate", LessThanOrEquals, Date.Today)
   //restrict on expiration date - can be null or non-null
    timeLineEventQuery.and(\a ->
        a.or(\o -> {
          o.compare("ExpirationDate", GreaterThanOrEquals, Date.Today)
          o.compare("ExpirationDate", Equals, null)
        })
    )

    var timeLineEventTypes = timeLineEventQuery.select({QuerySelectColumns.path(Paths.make(TimelineEvent_SP#EventType))})
        .transformQueryRow(\row -> row.getColumn(0) as TimelineCategory_SP)
        .toSet()
    timeLineEventTypes = new TreeSet(timeLineEventTypes)

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      var timeLineEvents = timeLineEventQuery.select()
      for (timeLineEvent in timeLineEvents) {
        timeLineEvent = bundle.add(timeLineEvent)
        timeLineEvent.InUse = true
      }
    })

    return timeLineEventTypes
  }

  /**
   * Removes the selected event type if it's not already used in the claim timeline
   * If the event type is already used in the claim timeline the
   * InUse indicator is set to true hence it can't be removed from the
   * Timeline Event Admin screen
   * @param timelineEvent The timeline event that needs to be removed from the administration screen
   */
  @IncludeInDocumentation
  static function removeTimelineEvent(timelineEvent : TimelineEvent_SP){
    if(timelineEvent.InUse != true){
      timelineEvent.remove()

    }else{
      throw new gw.api.util.DisplayableException("The selected event type cannot be removed because it is already used in the Claim Timeline.")
    }
  }

  /**
   * Gets the Timeline Event Types that are already added through the time line event administration screen
   * @return IQueryBeanResult of the TimelineEvent_SP entity
   */
  @IncludeInDocumentation
  static function getTimelineEventTypes(): IQueryBeanResult<TimelineEvent_SP> {
    return Query.make(TimelineEvent_SP).select()
  }


}

