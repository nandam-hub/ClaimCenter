package edge.capabilities.claim.dto

uses edge.jsonmapper.JsonProperty


/**
 * Claim search request DTO.
 */
class ClaimSearchDTO {
  @JsonProperty
  var _claimStates : typekey.ClaimState[] as ClaimStates

  @JsonProperty
  var _queryText : String as QueryText

  @JsonProperty
  var _policyType : typekey.PolicyType as PolicyType


}
