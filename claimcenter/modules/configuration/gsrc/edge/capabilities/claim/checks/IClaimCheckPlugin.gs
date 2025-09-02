package edge.capabilities.claim.checks

uses edge.capabilities.claim.checks.dto.CheckDTO


interface IClaimCheckPlugin {

  /**
   * Get the list of checks for a claim
   */
  public function getChecks(claim:Claim) : Check[]

  /**
   * Get the list of check DTO's for a claim
   */
  public function getChecksDTO(claim: Claim) : CheckDTO[]

  /**
   * Converts array of checks into the DTO for the given user.
   */
  public function toDTO(check: Check[]) : CheckDTO[]

  /**
   * Converts check into the DTO for the given user.
   */
  public function toDTO(check: Check) : CheckDTO

}
