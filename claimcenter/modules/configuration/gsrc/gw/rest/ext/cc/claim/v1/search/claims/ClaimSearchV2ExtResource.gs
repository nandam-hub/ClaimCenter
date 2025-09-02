package gw.rest.ext.cc.claim.v1.search.claims

uses gw.rest.core.cc.claim.v1.search.claims.ActiveClaimCoreSearch
uses gw.rest.core.cc.claim.v1.search.claims.ArchivedClaimCoreSearch
uses gw.rest.core.cc.claim.v1.search.claims.ClaimSearchV2CoreResource

@Export
class ClaimSearchV2ExtResource extends ClaimSearchV2CoreResource {

  override function createActiveClaimSearch() : ActiveClaimCoreSearch {
    return new ActiveClaimExtSearch(this.ResourceName, this.Body)
  }

  override function createArchivedClaimSearch() : ArchivedClaimCoreSearch {
    return new ArchivedClaimExtSearch(this.ResourceName, this.Body)
  }
}