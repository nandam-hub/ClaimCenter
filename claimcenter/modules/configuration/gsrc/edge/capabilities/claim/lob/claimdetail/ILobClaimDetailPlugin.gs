package edge.capabilities.claim.lob.claimdetail

/**
 * Plugin used to extend claim information with LOB-specific data.
 */
interface ILobClaimDetailPlugin<CT, ET> {
  /**
   * Converts claim to a lob-specific claim data.
   */
  public function toDTO(claim : Claim) : CT
  
  
  /**
   * Covrets exposure to LOB-specific exposure data.
   */
  public function exposureToDTO(exposure : Exposure): ET
}
