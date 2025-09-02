package gw.pcf.freetextclaimsearch

uses gw.api.claim.ClaimUtil
uses gw.api.database.IQueryBeanResult
uses gw.api.search.FreeTextClaimSearchResults
uses gw.cc.claim.ClaimSearchCriteriaWrapper

uses java.math.BigDecimal
uses java.math.RoundingMode
uses java.text.NumberFormat

@Export
public class FreeTextClaimSearchScreenHelper {
  private final var criteria: ClaimSearchCriteriaWrapper as Criteria
  private final var formatter: NumberFormat
  private var maxScore: float


  construct() {
    criteria = ClaimUtil.getClaimSearchCriteria()
    formatter = NumberFormat.getPercentInstance()
    maxScore = 0;
  }

  /**
   * Performs a search against solr and returns the search results
   */
  public function search(): IQueryBeanResult<FreeTextClaimSearchEntity> {
    var results = criteria.Criteria.performFreeTextSearch(!Active);

    maxScore = results typeis FreeTextClaimSearchResults? results.MaxScore : maxScore
    return results.ActiveClaimSearchResults
  }

  /**
   * Checks whether we query against the active or the archived database
   */
  public property get Active(): boolean {
    return criteria.Criteria.FreeTextClaimSearchType == FreeTextClaimSearchType.TC_BYCONTACTINFOACTIVE
  }

  /**
   * Calculates the score percentage and formats it as a percent string
   */
  function getScorePercent(score: BigDecimal): String {
    if (score == null or maxScore == 0) {
      return null
    }
    var scorePercent = score.divide(maxScore, RoundingMode.DOWN).floatValue()
    return formatter.format(scorePercent)
  }
}