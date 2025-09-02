package gw.solr.request

uses gw.plugin.solr.SolrSearchStore
uses gw.solr.utils.CCACLInfo
uses gw.solr.utils.CCSolrUtils


/**
 * Index message request for the claim index.
 */
@Export
class ClaimIndexRequest extends AbstractIndexRequest {

  var _store : SolrSearchStore

  construct(claim : Claim, store : SolrSearchStore) {
    _store = store
    var aclInfo = CCACLInfo.createACLInfoForClaim(claim.Access)
    addDocument(ClaimIndexDocument.createDocument(claim, aclInfo))
  }

  construct(claim : Claim) {
    this(claim, SolrSearchStore.ACTIVE)
  }

  override function getDocumentType() : String {
    return CCSolrUtils.CC_CLAIM_DOCUMENT_TYPE + _store.suffix()
  }
}
