package edge.capabilities.claim.local

uses edge.capabilities.claim.dto.ClaimSearchDTO
uses edge.capabilities.claim.summary.dto.ClaimSummaryResultDTO
uses edge.capabilities.claim.summary.dto.QueryOptionsDTO

/**
 * Plugin used to access claim data.
 * <p>Plugin implementation is responsible for claim access checks.
 */
interface IClaimRetrievalPlugin {
  /**
   * Searches for claims available to the given user.
   */
  public function searchClaims(req : ClaimSearchDTO) : Claim[]


  /**
   * Searches for claims with pagination
   */
  public function searchClaims(req : ClaimSearchDTO, queryOptions: QueryOptionsDTO) : ClaimSummaryResultDTO

  /**
   * Retrieves claim by its number. Returns <code>null</code> if claim was not found.
   */
  public function getClaimByNumber(number : String) : Claim
}
