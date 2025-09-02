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
 * Generate timeline entries for documents. Generates entries for all different phases of
 * document handling in the claims like creation and deletion
 */
@IncludeInDocumentation
class DocumentTimelineEntryGenerator implements TimelineEntryGenerator {

  /**
   * Queries the database and returns all Documents that are attached to the claim
   * CLAIM. If DATE is not null, this method queries for notes with AuthoringDates
   * before the date DATE.
   * The notes returned from the DB are processed and used to create Timeline Entries.
   * @param claim
   * @param date
   * @return
   */
  @IncludeInDocumentation
  public function generateEntries(claim: Claim, date: Date): List<TimelineEntry_SP> {
    var documents : IQueryBeanResult<Document> = null
    if (date == null) {
      documents = Queries.createQuery<Document>(Document)
          .compare(Document#Claim, Relop.Equals, claim)
          .withFindRetired(true)
          .select()
    } else {
      documents = Queries.createQuery<Document>(Document)
          .compare(Document#Claim, Relop.Equals, claim)
          .compare(Document#CreateTime, Relop.LessThan, date)
          .withFindRetired(true)
          .select()
    }
    var retList = new ArrayList<TimelineEntry_SP>()
    for (document in documents) {
      retList.add(generateDocumentEntry(document, claim.Bundle, true))
      if (document.Retired) {
        retList.add(generateDocumentEntry(document, claim.Bundle, false))
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
      if ((bean typeis Document) && (bean.Claim == claim) && (bean.New)) {
        retEntries.add(generateDocumentEntry(bean as Document, bundle, true))
      }
    }
    for (bean in bundle.RemovedBeans) {
      if ((bean typeis Document) && (bean.Claim == claim) && (!bean.New)) {
        retEntries.add(generateDocumentEntry(bean as Document, bundle, false))
      }
    }
    return retEntries
  }

  /**
   * Takes in a document DOCUMENT, bundle BUNDLE, and boolean CREATE and returns a TimelineEntry with
   * with associated notes. If CREATE == true, we create a creation timeline entry. If not, we
   * create a deletion entry.
   * @param note
   * @param bundle
   * @param create
   * @return
   */
  @IncludeInDocumentation
  function generateDocumentEntry(document : Document, bundle : Bundle, create : boolean) : TimelineEntry_SP {
    var entry = new TimelineEntry_SP(bundle)
    var date = create ? document.CreateTime: DateUtil.currentDate()
    entry.EventDate = (date == null) ? DateUtil.currentDate() : date
    entry.TimelineCategory = TimelineCategory_SP.TC_DOCUMENTS
    var user = create ? User.util.CurrentUser : document.UpdateUser

    entry.Summary = DisplayKey.get(create ? "SP.Timeline.Summary.Document.Created"
            : "SP.Timeline.Summary.Document.Deleted", new Object[]{
        document.Name,
        user.DisplayName})

    entry.Importance = create ? TimelineImportance_SP.TC_HIGH : TimelineImportance_SP.TC_MEDIUM

    var documentLink = new TimelineLink_SP(bundle)
    documentLink.Sequence = 0
    documentLink.Bean = document
    entry.addToTimelineLinks(documentLink)
    if (user != null) {
      var userLink = new TimelineLink_SP(bundle)
      userLink.Sequence = 1
      userLink.Bean = user
      entry.addToTimelineLinks(userLink)
    }
    var related = document.RelatedTo
    if ((related != null) && !(related typeis Claim)) {
      var relatedLink = new TimelineLink_SP(bundle)
      relatedLink.Bean = related as KeyableBean
      entry.addToTimelineLinks(relatedLink)
    }

    var matter = document.Matter
    if (matter != null) {
      var matterLink = new TimelineLink_SP(bundle)
      matterLink.Bean = matter as KeyableBean
      entry.addToTimelineLinks(matterLink)
    }

    // If this is a retired (deleted) document, then remove document links from new entry and associated timeline entry links.
    if (!create) {
      entry.EventDate = DateUtil.currentDate()
      entry.removeLink(0)
      var claimTimelineEntries = document.Claim.Timeline_SP.TimelineEntries
      var documentLinks = new java.util.ArrayList<TimelineLink_SP>()
      claimTimelineEntries.each( \ elt -> {
        var resultsToAdd = elt.TimelineLinks
            .where(\aLink -> aLink.BeanType == "entity.Document" && aLink.BeanID == document.PublicID)
        documentLinks.addAll(resultsToAdd.toList())
      })


      // Remove document link from timeline entry since document is no longer available
      documentLinks.each( \ elt -> elt.TimelineEntry.removeLink(0))
    }
    return entry
  }
}
