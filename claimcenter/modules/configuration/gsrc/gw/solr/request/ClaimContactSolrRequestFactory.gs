package gw.solr.request

uses gw.plugin.solr.SolrSearchStore
uses org.json.simple.JSONArray

@Export
class ClaimContactSolrRequestFactory {
  // ------------------------------------------------------------------
  // Creation of the correct Solr index update messages
  // ------------------------------------------------------------------

  static function createClaimIndexRequest(claim : Claim) : List<IMessageRequest> {
    var indexRequest = new ClaimContactIndexRequest(claim)
    return Collections.singletonList<IMessageRequest>(indexRequest)
  }

  static function createClaimDeleteRequest(claim : Claim) : List<IMessageRequest> {
    var deleteRequest = new ClaimContactDeleteRequest(claim)
    return Collections.singletonList<IMessageRequest>(deleteRequest)
  }

  static function createClaimIndexRequest(claimContact : ClaimContact) : List<IMessageRequest> {
    var indexRequest = new ClaimContactIndexRequest(claimContact)
    return Collections.singletonList<IMessageRequest>(indexRequest)
  }

  static function createClaimArchiveIndexRequest(docArray : JSONArray, store : SolrSearchStore) : List<IMessageRequest> {
    var indexRequest = new ClaimContactArchiveRequest(docArray, store)
    return Collections.singletonList<IMessageRequest>(indexRequest)
  }

  static function createClaimDeleteRequest(claimContact : ClaimContact) : List<IMessageRequest> {
    var deleteRequest = new ClaimContactDeleteRequest(claimContact)
    return Collections.singletonList<IMessageRequest>(deleteRequest)
  }

  static function createClaimDeleteByClaimNumberRequest(claimNumber : String, store : SolrSearchStore) : List<IMessageRequest> {
    var deleteRequest = new ClaimContactDeleteRequest(claimNumber, store)
    return Collections.singletonList<IMessageRequest>(deleteRequest)
  }
}