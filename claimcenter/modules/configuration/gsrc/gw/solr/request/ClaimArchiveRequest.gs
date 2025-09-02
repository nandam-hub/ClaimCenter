package gw.solr.request

uses gw.solr.utils.CCACLInfo
uses gw.solr.utils.CCSolrUtils


/**
 * Message request for the archive claims index.
 */
@Export
class ClaimArchiveRequest extends AbstractIndexRequest implements IMessageRequest {

  construct(claim : Claim) {
    var aclInfo = CCACLInfo.createACLInfoForClaim(claim.Access)
    addDocument(ClaimArchiveDocument.createDocument(claim, aclInfo))
  }

  override function getDocumentType() : String {
    return CCSolrUtils.CC_CLAIM_ARCHIVE_DOCUMENT_TYPE
  }
}
