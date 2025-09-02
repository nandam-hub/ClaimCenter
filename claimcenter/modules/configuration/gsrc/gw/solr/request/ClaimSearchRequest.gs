package gw.solr.request

uses gw.cc.config.Resources
uses gw.plugin.solr.SolrSortColumn
uses gw.solr.mapper.CCBuildDate
uses gw.solr.utils.CCACLInfo
uses gw.solr.utils.CCSolrDateUtil
uses gw.solr.utils.CCSolrUtils

/**
 * Claim search request.
 */
@Export
class ClaimSearchRequest extends AbstractSearchRequest<ArchivedClaimSearchEntity> {

  var _claimSearchCriteria : ArchivedClaimSearchCriteria

  construct(claimSearchCriteriaIn : ArchivedClaimSearchCriteria, sortColumns : List<SolrSortColumn>) {
    super(Resources.CLAIM_SEARCH_CONFIG, sortColumns)
    _claimSearchCriteria = claimSearchCriteriaIn
  }

  construct(claimSearchCriteriaIn : ArchivedClaimSearchCriteria) {
    this(claimSearchCriteriaIn, null)
  }

  override function getDocumentType() : String {
    return CCSolrUtils.CC_CLAIM_ARCHIVE_DOCUMENT_TYPE
  }

  // ------------------------------------------------------------------
  // Query construction
  // ------------------------------------------------------------------

  override function createSearchCriteria() {
    addCriterion(_claimSearchCriteria)
    addCriterion(CCACLInfo.ACLINFO, CCACLInfo.createACLInfoForCurrentUser(true, 300))
    addDateCriterion((_claimSearchCriteria as ArchivedClaimSearchCriteria).DateCriterionChoice)
  }

  function addDateCriterion(criterion : DateCriterionChoice) {
    if (criterion != null) {
      var key = CCSolrDateUtil.getDateKey(criterion)
      if (key != null) {
        var range = CCSolrDateUtil.getDateRange(criterion)
        addCriterion(key, range)
        addCriterion(CCBuildDate.DATE_FIELD_SELECTION, key)
      }
    }
  }

  // ------------------------------------------------------------------
  // Query result processing
  // ------------------------------------------------------------------

  override function createResultRow() : ArchivedClaimSearchEntity {
    return new ArchivedClaimSearchEntity()
  }
}
