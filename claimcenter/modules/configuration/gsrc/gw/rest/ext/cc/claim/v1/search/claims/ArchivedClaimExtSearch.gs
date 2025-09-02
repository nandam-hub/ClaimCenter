package gw.rest.ext.cc.claim.v1.search.claims

uses gw.api.json.JsonObject
uses gw.rest.core.cc.claim.v1.search.claims.ArchivedClaimCoreSearch

@Export
class ArchivedClaimExtSearch extends ArchivedClaimCoreSearch {

  construct(resourceName : String, body : JsonObject) {
    super(resourceName, body)
  }
}