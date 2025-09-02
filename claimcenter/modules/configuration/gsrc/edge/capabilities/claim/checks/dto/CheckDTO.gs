package edge.capabilities.claim.checks.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.currency.dto.AmountDTO
uses java.util.Date

class CheckDTO {

  /**
   * The number of the issued check
   */
  @JsonProperty
  var _checkNumber : String as CheckNumber

  /**
   * The Status of the check
   */
  @JsonProperty
  var _status : TransactionStatus as Status

  /**
   * The gross amount of the check
   */
  @JsonProperty
  var _grossAmount : AmountDTO as GrossAmount

  /**
   * The scheduled date for the check to arrive
   */
  @JsonProperty
  var _scheduledDate : Date as ScheduledDate

  /**
   * The issue date for the check
   */
  @JsonProperty
  var _issueDate : Date as IssueDate

  /**
   * List of check payees
   */
  @JsonProperty
  var _payee : String[] as Payee
}
