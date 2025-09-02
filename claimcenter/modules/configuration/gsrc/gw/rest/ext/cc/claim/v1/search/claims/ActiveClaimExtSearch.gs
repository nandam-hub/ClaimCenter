package gw.rest.ext.cc.claim.v1.search.claims

uses gw.api.json.JsonObject
uses gw.rest.core.cc.claim.v1.search.claims.ActiveClaimCoreSearch

@Export
class ActiveClaimExtSearch extends ActiveClaimCoreSearch {

  construct(resourceName : String, body : JsonObject) {
    super(resourceName, body)
  }
}