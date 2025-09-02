package edge.capabilities.claim.fnol.local

uses edge.capabilities.claim.fnol.dto.FnolDTO

/**
 * Plugin used to deal with the FNOL.
 */
interface IFnolPlugin {
  /**
   * Creates a claim with the specific policy using fnol data.
   */
  public function createClaim(policy : Policy, req : FnolDTO) : Claim

  /**
   * Updates claim on the same policy using new fnol data.
   */
  public function updateClaim(claim:Claim, req : FnolDTO)

  /**
   * Performs any updates required prior to submitting the claim
   */
  public function submitClaim(claim : Claim, dto : FnolDTO)

  /**
   * Moves claim into a new policy and updates claim data.
   */
  public function moveToNewPolicy(claim : Claim, newPolicy : Policy, req : FnolDTO)

  /**
   * Converts FNOL into the dto.
   */
  public function toDTO(claim : Claim) : FnolDTO
}
