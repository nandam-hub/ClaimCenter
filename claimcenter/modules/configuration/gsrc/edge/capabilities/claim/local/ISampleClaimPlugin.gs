package edge.capabilities.claim.local

uses edge.capabilities.claim.details.dto.ClaimDTO

interface ISampleClaimPlugin {
  public function createSampleClaimForPolicy(policyNumber: String, claimState: ClaimState): ClaimDTO
}
