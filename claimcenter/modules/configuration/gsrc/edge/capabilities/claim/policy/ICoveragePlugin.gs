package edge.capabilities.claim.policy

uses edge.capabilities.claim.policy.dto.CoverageDTO

/**
 * Coverage information plugin.
 */
interface ICoveragePlugin {
  public function toDTO(coverage : Coverage) : CoverageDTO
}
