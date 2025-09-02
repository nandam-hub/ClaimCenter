package gw.solr

uses gw.solr.consistency.IReconstructor
uses gw.solr.request.ClaimIndexDocument
uses gw.solr.utils.CCACLInfo
uses org.json.simple.JSONObject


@Export
class CCClaimDocumentReconstructor implements IReconstructor {

  override function reconstructDocument(docObj : JSONObject, updatedBeans : List<KeyableBean>) : JSONObject {
    var theClaim = updatedBeans.firstWhere( \ b -> b typeis Claim ) as Claim
    var aclInfo = CCACLInfo.createACLInfoForClaim(theClaim.Access)
    return ClaimIndexDocument.createDocument(theClaim, aclInfo).asJSON()
  }

}
