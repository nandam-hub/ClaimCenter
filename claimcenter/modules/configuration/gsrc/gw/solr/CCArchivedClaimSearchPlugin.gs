package gw.solr

uses gw.plugin.solr.SolrSortColumn
uses gw.solr.request.AbstractSearchRequest
uses gw.solr.request.ClaimSearchRequest
uses org.apache.solr.client.solrj.SolrQuery

/**
 * External Solr search for claims.
 */
@Export
class CCArchivedClaimSearchPlugin extends gw.solr.AbstractSolrEntitySearchPlugin<ArchivedClaimSearchEntity, ArchivedClaimSearchCriteria> {

  construct() {
    super("CCArchivedClaimSearchPlugin")
  }

  override function createSearchRequest(criteria : ArchivedClaimSearchCriteria, sortColumns : List<SolrSortColumn>) : AbstractSearchRequest<ArchivedClaimSearchEntity> {
    return new ClaimSearchRequest(criteria, sortColumns)
  }

  override function createPagingSolrQuery(searchRequest : AbstractSearchRequest, startsWith : int, dynamicFetchSize : int) : SolrQuery {
    return constructPagingSearchQuery(searchRequest, startsWith, dynamicFetchSize, "AND", "*,[child]")
  }
}
