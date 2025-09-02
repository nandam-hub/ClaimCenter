package edge.capabilities.claim.lob
uses edge.security.EffectiveUser

/**
 * Plugin used to check access to a claim contact.
 */
interface IClaimContactAccessPlugin {
  /**
   * Checks if user have access to the specified claim contact.
   */
  public function haveAccess(user : EffectiveUser, contact : ClaimContact) : boolean
}
