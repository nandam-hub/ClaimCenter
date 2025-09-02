package gw.solr.request

uses gw.solr.utils.CCSolrUtils


/**
 * Message request to delete a claim contact.
 */
@Export
class ClaimDeleteRequest extends AbstractDeleteRequest {

  construct(rootPublicID : String) {
    addQuery("_root_", rootPublicID)
  }

  override function getDocumentType() : String {
    return CCSolrUtils.CC_CLAIM_ARCHIVE_DOCUMENT_TYPE
  }
}
