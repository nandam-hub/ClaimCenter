package edge.capabilities.claim.fnol.policy.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size

class PolicySummaryDTO {

  
  @JsonProperty @Required @Size(1, 40)
  private var _policyNumber : String as PolicyNumber
    
  @JsonProperty @Required
  private var _effectiveDate : Date as EffectiveDate
    
  @JsonProperty @Required
  private var _expirationDate : Date as ExpirationDate
  
  @JsonProperty
  private var _insured : String as Insured
  
  @JsonProperty
  private var _address : String as Address
  
  @JsonProperty @Required
  private var _policyType : typekey.PolicyType as PolicyType
  
  @JsonProperty
  private var _city : String as City
  
  @JsonProperty
  private var _state : typekey.State as State
  
  @JsonProperty
  private var _zip : String as Zip

}
