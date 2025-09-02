package edge.capabilities.claim.summary

uses edge.capabilities.claim.summary.dto.ClaimSummaryDTO

/**
 * Plugin used to extract claim summary for the claim.
 * This plugin should not check access to the claim but can check access to the particular claim
 * entities (like claim contacts).
 */
interface IClaimSummaryPlugin {
  public function getSummary(claim : Claim) : ClaimSummaryDTO
}
