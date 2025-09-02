package gw.solr.request

uses org.json.simple.JSONObject
uses gw.solr.utils.CCACLInfo
uses gw.cc.config.Resources

/**
 * Solr index document for the Claim index.
 */
@Export
class ClaimIndexDocument extends AbstractIndexDocument {

  static function createKey(claim : Claim) : ClaimIndexDocument {
    var document = new ClaimIndexDocument()
    document.constructDocument(claim, true, null)
    return document
  }

  static function createDocument(claim : Claim, aclInfo : CCACLInfo) : ClaimIndexDocument {
    var document = new ClaimIndexDocument()
    document.constructDocument(claim, false, aclInfo)
    return document
  }

  static function createKey(jsonDoc : JSONObject) : ClaimIndexDocument {
    var document = new ClaimIndexDocument()
    document.constructDocument(jsonDoc, true)
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

  function constructDocument(jsonDoc : JSONObject, keyFieldsOnly : boolean) {
    populateIndexData(jsonDoc, keyFieldsOnly)
  }

}
