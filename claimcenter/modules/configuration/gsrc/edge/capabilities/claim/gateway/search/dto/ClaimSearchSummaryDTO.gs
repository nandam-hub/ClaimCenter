package edge.capabilities.claim.gateway.search.dto

uses edge.capabilities.currency.dto.AmountDTO
uses edge.jsonmapper.JsonProperty
uses java.util.Date

/**
 * A striped down version of the ClaimDTO to be used when returning paginated results from a claim query
 */
class ClaimSearchSummaryDTO {

  @JsonProperty
  var _product : String as Product

   @JsonProperty
  var _lineOfBusinessCode : String as LineOfBusinessCode

  @JsonProperty
  var _claimNumber : String as ClaimNumber

  @JsonProperty
  var _dateOfLoss : Date as DateOfLoss

  @JsonProperty
  var _state : String as State

  @JsonProperty
  var _stateCode : String as StateCode

  @JsonProperty
  var _policyNumber : String as PolicyNumber

  @JsonProperty
  var _accountNumber : String as AccountNumber

  @JsonProperty
  var _insuredName : String as InsuredName

  @JsonProperty
  var _isPersonalAccount : Boolean as IsPersonalAccount

  @JsonProperty
  var _totalIncurredNet: AmountDTO as TotalIncurredNet

  @JsonProperty
  var _totalPayments: AmountDTO as TotalPayments
}
