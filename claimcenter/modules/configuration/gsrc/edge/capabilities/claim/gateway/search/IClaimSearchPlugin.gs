package edge.capabilities.claim.gateway.search

uses java.lang.Integer
uses edge.capabilities.claim.gateway.search.dto.ClaimSearchResultDTO
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

interface IClaimSearchPlugin {

  public function getClaimsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : ClaimSearchResultDTO
  public function getOpenClaimsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : ClaimSearchResultDTO
  public function getClosedClaimsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : ClaimSearchResultDTO
  public function getClaimsForProducerCodes(createdInLastXDays : Integer, producerCodes : String[], queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : ClaimSearchResultDTO
  public function getClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String) : ClaimSearchResultDTO
  public function getOpenClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String) : ClaimSearchResultDTO
  public function getClosedClaimsForProducerCode(createdInLastXDays: Integer, queryOptions: QueryOptionsDTO, aProducerCode: String) : ClaimSearchResultDTO

}
