package gw.solr.request

@Export
class ClaimSolrRequestFactory {
  // ------------------------------------------------------------------
  // Creation of the correct Solr index update messages
  // ------------------------------------------------------------------

  static function createClaimArchiveIndexRequest(claim : Claim) : List<IMessageRequest> {
    var indexRequest = new ClaimArchiveRequest(claim)
    return Collections.singletonList<IMessageRequest>(indexRequest)
  }

  static function createClaimDeleteByRootPublicIDRequest(rootPublicID : String) : List<IMessageRequest> {
    var deleteRequest = new ClaimDeleteRequest(rootPublicID)
    return Collections.singletonList<IMessageRequest>(deleteRequest)
  }
}