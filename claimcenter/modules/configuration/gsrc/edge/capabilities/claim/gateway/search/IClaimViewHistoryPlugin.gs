package edge.capabilities.claim.gateway.search

interface IClaimViewHistoryPlugin {

  public function getRecentlyViewedClaimsForEffectiveUser() : Claim[]
  public function addRecentlyViewedClaimForEffectiveUser(aClaim : Claim)

}
