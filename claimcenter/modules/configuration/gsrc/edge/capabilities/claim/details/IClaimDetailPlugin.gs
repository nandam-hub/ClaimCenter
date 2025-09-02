package edge.capabilities.claim.details

uses edge.capabilities.claim.details.dto.ClaimDTO

/**
 * Claim details provider.
 */
interface IClaimDetailPlugin {
  /**
   * Converts claim into the DTO for the given user.
   */
  public function toDTO(claim:Claim) : ClaimDTO
}
