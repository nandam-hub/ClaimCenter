package edge.capabilities.claim.policy

uses edge.capabilities.claim.policy.dto.PolicyDTO

/**
 * Claim policy handler.
 */
interface IPolicyPlugin {
  /**
   * Converts policy to its DTO-like representation. This plugin could restrict
   * disclosed information to a particular level only. 
   * <p>This method may return <code>null</code> if user do not have access to the 
   * policy in question.
   */
  public function toDTO(policy : Policy) : PolicyDTO
}
