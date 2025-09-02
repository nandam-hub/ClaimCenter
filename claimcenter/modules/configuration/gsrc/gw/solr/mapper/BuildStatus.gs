package gw.solr.mapper

uses gw.lang.Deprecated
uses gw.xsd.config.solr_search_config.DataProperty
uses gw.xsd.config.solr_search_config.ResultField
uses java.util.List


/**
 * Builds the status.
 *
 * @deprecated Status field processing is now handled by
 * {@link gw.solr.request.ClaimContactSearchRequestHelper#bulkProcessResponseFields(List<FreeTextClaimSearchEntity>, int, gw.plugin.solr.SolrSearchStore) bulkProcessResponseFields}
 * for improved performance.
 */
@Deprecated("Since 2023.10.  Replaced by ClaimContactSearchRequest.bulkProcessResponseFields(List<FreeTextClaimSearchEntity>, int, SolrSearchStore)")
@Export
class BuildStatus implements ISolrQueryResultMapper {
  
  /**
   * Status column is not sortable
   */
  override function mapSortColumn(resultFields : List<ResultField>, criteriaProperties : List<DataProperty>, dataHolder : IDataHolder) : String {
    return null
  }

  /**
   * From the claimNumber retrieve the claim and get its current state.
   *
   * @return the status of the claim
   */
  override function mapQueryResult(resultFields : List<ResultField>, criteriaProperties : List<DataProperty>, dataHolder : IDataHolder, solrResult : IResultHolder) : Object {
    var retVal = ""
    var claimNumber = solrResult.lookup<String>( resultFields.get(0) )
    var claimInfo = Claim.finder.findClaimInfoByClaimNumber(claimNumber)
    if(claimInfo != null) {
      switch(claimInfo.ArchiveState) {
        case TC_ARCHIVED:    retVal = ClaimState.TC_ARCHIVED.DisplayName
                             break
        case TC_RETRIEVING:  retVal = ArchiveState.TC_RETRIEVING.DisplayName
                             break
        default:
             if(claimInfo.Claim!=null) {
               retVal = claimInfo.Claim.State.DisplayName
             }
      }
    }
    return retVal
  }

}
