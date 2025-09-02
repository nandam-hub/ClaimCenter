package edge.capabilities.claim.gateway.search

uses edge.capabilities.claim.gateway.search.dto.ClaimSearchSummaryDTO

interface IClaimSearchSummaryPlugin {
  public function toDTO(claim: Claim) : ClaimSearchSummaryDTO
  public function toDTOArray(claims: Claim[]) : ClaimSearchSummaryDTO[]
}
