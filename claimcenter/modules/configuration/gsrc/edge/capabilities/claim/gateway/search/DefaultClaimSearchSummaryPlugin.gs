package edge.capabilities.claim.gateway.search

uses edge.capabilities.claim.gateway.search.dto.ClaimSearchResultDTO
uses edge.capabilities.claim.gateway.search.dto.ClaimSearchSummaryDTO
uses edge.capabilities.currency.dto.AmountDTO
uses edge.di.annotations.ForAllGwNodes

class DefaultClaimSearchSummaryPlugin implements IClaimSearchSummaryPlugin {

   @ForAllGwNodes
   construct(){}

  override function toDTO(claim: Claim): ClaimSearchSummaryDTO {
    final var dto = new ClaimSearchSummaryDTO()

    dto.AccountNumber = claim.Policy.AccountNumber
    dto.PolicyNumber = claim.Policy.PolicyNumber
    dto.DateOfLoss = claim.LossDate
    dto.ClaimNumber = claim.ClaimNumber
    dto.StateCode = claim.State.getCode()
    dto.State = claim.State.DisplayName
    dto.Product = claim.Policy.PolicyType.DisplayName
    dto.LineOfBusinessCode = claim.LOBCode.getCode()
    dto.InsuredName = claim.Insured.DisplayName
    dto.IsPersonalAccount = claim.Insured typeis Person
    dto.TotalIncurredNet = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalIncurredNet)
    dto.TotalPayments = AmountDTO.fromCurrencyAmount(claim.ClaimRpt.TotalPayments)

    return dto
  }

  override function toDTOArray(claims : Claim[]): ClaimSearchSummaryDTO[] {
    if(claims != null && !claims.IsEmpty){
      return claims.map( \ claim -> toDTO(claim))
    }
    return new ClaimSearchSummaryDTO[]{}
  }
}
