package edge.capabilities.claim.lob.policy

/**
 * Policy line extension plugin for policies.
 */
interface ILobPolicyPlugin<T> {
  /**
   * Converts policy to a LOB-specific policy extension.
   */
  public function toDTO(policy : Policy) : T
}
