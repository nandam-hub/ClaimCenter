package gw.api.archiving

uses gw.api.claim.ClaimUtil
uses gw.api.database.IQueryBeanResult
uses gw.api.locale.DisplayKey
uses gw.api.search.ArchivedClaimSearchResults
uses gw.api.system.PLConfigParameters
uses gw.cc.claim.ArchivedClaimSearchCriteriaWrapper

@Export
public class FreeTextArchivedClaimSearchScreenHelper {
  private final var criteria : ArchivedClaimSearchCriteriaWrapper as Criteria
  private final var selectedClaims : Set<String>

  construct() {
    criteria = ClaimUtil.getArchivedClaimSearchCriteria()
    criteria.Criteria.ClaimSearchType = ClaimSearchType.TC_ARCHIVED
    selectedClaims = new HashSet<String>()
  }

  /**
   * Performs a search against solr and returns the search results
   */
  public function search(): IQueryBeanResult<ArchivedClaimSearchEntity> {
    var results = criteria.Criteria.performSolrSearch();
    return results
  }

  function toggleClaimSelectionHandler(claim : ArchivedClaimSearchEntity) {
    if (selectedClaims.contains(claim.ClaimNumber)) {
      selectedClaims.remove(claim.ClaimNumber)
    } else {
      selectedClaims.add(claim.ClaimNumber)
    }
  }

  function isClaimSelected(claim : ArchivedClaimSearchEntity) : boolean {
    return selectedClaims.contains(claim.ClaimNumber)
  }

  function selectAllOnScreen(results : IQueryBeanResult<ArchivedClaimSearchEntity>) {
    if (results typeis ArchivedClaimSearchResults) {
      var pageSize = PLConfigParameters.ListViewPageSizeDefault.getValue()
      var currentPageRecords = results.CurrentPageIterator.toList()
      var numOfResultsOnScreen = Math.min(pageSize, currentPageRecords.size())
      var resultsOnScreen = currentPageRecords.subList(0, numOfResultsOnScreen)
      selectedClaims.addAll(resultsOnScreen*.ClaimNumber.toSet())
    }
  }

  function resetSelections() {
    selectedClaims.clear()
  }

  function getClaimSelectButtonLabel(claim : ArchivedClaimSearchEntity) : String {
    return isClaimSelected(claim) ? DisplayKey.get("LV.Claim.ClaimSearchResults.Button.Unselect") : DisplayKey.get("LV.Claim.ClaimSearchResults.Button.Select")
  }

  property get selectedClaimNumbers() : List<String> {
    return selectedClaims.toList().sort()
  }

  property get selectedClaimCount() : int {
    return selectedClaims.Count
  }
}