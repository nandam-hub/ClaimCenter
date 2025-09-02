package gw.solr.request

uses gw.cc.config.Resources
uses gw.solr.utils.CCACLInfo

/**
 * Solr index document for archived Claims.
 */
@Export
class ClaimArchiveDocument extends AbstractIndexDocument {

  static function createDocument(claim : Claim, aclInfo : CCACLInfo) : ClaimArchiveDocument {
    var document = new ClaimArchiveDocument()
    document.constructDocument(claim, false, aclInfo)
    return document
  }
  
  construct() {
    super(Resources.CLAIM_SEARCH_CONFIG)
  }

  function constructDocument(claim : Claim, keyFieldsOnly : boolean, aclInfo : CCACLInfo) {
    addIndexData(claim)
    if (aclInfo != null) {
      addIndexData("ACLInfo", aclInfo)
      // must add referenced beans for consistency version tracking
      addReferencedBeans(aclInfo.ReferencedBeans)
    }
    populateIndexData(keyFieldsOnly)
  }

}
