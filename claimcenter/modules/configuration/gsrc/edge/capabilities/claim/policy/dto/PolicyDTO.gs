package edge.capabilities.claim.policy.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.claim.lob.policy.dto.PolicyLobDTO
uses edge.aspects.validation.annotations.Required

class PolicyDTO {
  @JsonProperty  // @ReadOnly
  var _publicID : String as PublicID

  @JsonProperty  // @ReadOnly
  var _accountNumber : String as AccountNumber

  @JsonProperty
  @Required
  var _policyNumber : String as PolicyNumber
  
  @JsonProperty // @ReadOnly
  @Required
  var _policyType : String as PolicyType
  
  @JsonProperty // @ReadOnly
  @Required
  var _expirationDate :   Date as ExpirationDate
  
  @JsonProperty // @ReadOnly
  var _effectiveDate : Date as EffectiveDate
  
  @JsonProperty // @ReadOnly
  var _status : String as Status
  
  @JsonProperty // @ReadOnly
  var _coverageDTOs : CoverageDTO[] as Coverages
  
  /**
   * Line-of-business extension pack.
   */
  @JsonProperty // @ReadOnly
  var _lobs : PolicyLobDTO as Lobs
}
