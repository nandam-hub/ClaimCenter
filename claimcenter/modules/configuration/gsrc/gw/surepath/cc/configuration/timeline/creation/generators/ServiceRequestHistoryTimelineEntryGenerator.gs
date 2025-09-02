package gw.surepath.cc.configuration.timeline.creation.generators

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Queries
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bean
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.util.ArrayList
uses java.util.Date

/**
 * Generate timeline entries for service requests. Generates entries whenever a new service request is created,
 * modified or deleted. Also handles service requests having quote or an invoice.
 */

class ServiceRequestHistoryTimelineEntryGenerator implements TimelineEntryGenerator {
  /**
   * generateEntries finds every ServiceRequestChanges that is linked with the given Claim and before
   * the given Date and creates a TimelineEntry for each ServiceRequestChange.
   * <p>
   * If null is passed in instead of a Date, generateEntries finds all ServiceRequestChanges linked with
   * the given claim and create a TimelineEntry for them.
   * <p>
   * These TimelineEntries are added to an array and returned.
   *
   * @param claim a Claim for which you wish to find ServiceRequestChanges and create TimelineEntries
   *              for the found ServiceRequestChanges
   * @param date  a Date you wish to find ServiceRequestChanges before
   * @return a list of the TimelineEntries created for the ServiceRequestChanges
   */
  @IncludeInDocumentation
  public function generateEntries(claim : Claim, date : Date) : List<TimelineEntry_SP> {
    var retList = new ArrayList<TimelineEntry_SP>()
    var serviceRequestChanges : IQueryBeanResult<ServiceRequestChange> = null
    if (date == null) {
      serviceRequestChanges = Queries.createQuery<ServiceRequestChange>(ServiceRequestChange)
          .join(ServiceRequestChange#ServiceRequest)
          .compare(ServiceRequest#Claim, Relop.Equals, claim)
          .select()
    } else {
      serviceRequestChanges = Queries.createQuery<ServiceRequestChange>(ServiceRequestChange)
          .compare(ServiceRequestChange#Timestamp, Relop.LessThan, date)
          .join(ServiceRequestChange#ServiceRequest)
          .compare(ServiceRequest#Claim, Relop.Equals, claim)
          .select()
    }
    for (s in serviceRequestChanges) {
      retList.add(generateServiceRequestEntry(s, claim.Bundle))
    }

    return retList
  }

  public function generateEntries(bundle : Bundle, claim : Claim) : List<TimelineEntry_SP> {
    var retEntries = new ArrayList<TimelineEntry_SP>()
    for (b in bundle.InsertedBeans) {
      if ((b typeis ServiceRequestChange) && (b.ServiceRequest.Claim == claim)) {
        retEntries.add(generateServiceRequestEntry(b as ServiceRequestChange, bundle))

      }
    }
    return retEntries
  }

  function generateServiceRequestEntry(s : ServiceRequestChange, bundle : Bundle) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    var time = s.Timestamp
    entry.EventDate = (time == null) ? DateUtil.currentDate() : time
    entry.TimelineCategory = TimelineCategory_SP.TC_SERVICEREQUESTS
    entry.Importance = TimelineImportance_SP.TC_LOW
    var serviceRequestLink = new TimelineLink_SP(bundle)
    serviceRequestLink.Bean = s.ServiceRequest
    serviceRequestLink.Sequence = 0
    entry.addToTimelineLinks(serviceRequestLink)

    var relatedSpecialist = s.ServiceRequest.Specialist
    if ((relatedSpecialist != null)) {
      var relatedLink = new TimelineLink_SP(bundle)
      relatedLink.Bean = relatedSpecialist as KeyableBean
      relatedLink.Sequence = 1
      entry.addToTimelineLinks(relatedLink)
    }

    var relatedInitiator : Bean = s.Initiator
    if ((relatedInitiator != null)) {
      var relatedLink = new TimelineLink_SP(bundle)
      if (relatedInitiator typeis UserContact) {
        var relatedUsers = Queries.createQuery<User>(User)
            .compare(User#Contact, Relop.Equals, relatedInitiator)
            .select().toList()
        if (relatedUsers.size() == 1) {
          relatedInitiator = relatedUsers[0]
        }
      }
      relatedLink.Bean = relatedInitiator as KeyableBean
      relatedLink.Sequence = 2
      entry.addToTimelineLinks(relatedLink)
    }
    var hasQuote = false
    var hasInvoice = false
    var relatedStatement : Bean = s.RelatedStatement
    if ((relatedStatement != null)) {
      var relatedLink = new TimelineLink_SP(bundle)
      relatedLink.Bean = relatedStatement as KeyableBean
      relatedLink.Sequence = 3
      entry.addToTimelineLinks(relatedLink)
      if (relatedStatement typeis ServiceRequestInvoice) {
        hasInvoice = true
      }
      if (relatedStatement typeis ServiceRequestQuote) {
        hasQuote = true
      }
    }

// Service Requests in CC8 do not have RelatedTo field.
//    var relatedBean : Bean = s.ServiceRequest.RelatedTo
//    if ((relatedBean != null) && !(relatedBean typeis Claim)) {
//      var relatedLink = TimelineLink.TYPE.newInstance(bundle)
//      relatedLink.Bean = (relatedBean as KeyableBean)
//      entry.addToTimelineLinks(relatedLink)
//    }

    if (hasQuote) {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.ServiceRequestHistory.Quote",
          s.ServiceRequest.ServiceRequestNumber,
              s.ServiceRequest.ServicesString,
              s.ServiceRequest.Specialist.DisplayName,
              s.Initiator.DisplayName,
              s.Description)
    } else if (hasInvoice) {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.ServiceRequestHistory.Invoice",
              s.ServiceRequest.ServiceRequestNumber,
              s.ServiceRequest.ServicesString,
              s.ServiceRequest.Specialist.DisplayName,
              s.Initiator.DisplayName,
              s.Description)
    } else {
      entry.Summary = DisplayKey.get("SP.Timeline.Summary.ServiceRequestHistory",
              s.ServiceRequest.ServiceRequestNumber,
              s.ServiceRequest.ServicesString,
              s.ServiceRequest.Specialist.DisplayName,
              s.Initiator.DisplayName,
              s.Description)
    }

    entry.Summary.replaceAll("\n", ",")
    return entry
  }
}
