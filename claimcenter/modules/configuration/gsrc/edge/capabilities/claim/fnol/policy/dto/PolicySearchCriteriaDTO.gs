package edge.capabilities.claim.fnol.policy.dto

uses edge.aspects.validation.annotations.Size
uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.FilterByCategory

class PolicySearchCriteriaDTO {

  
  @JsonProperty
  @Size(0, 40)
  private var _accountNumber : String as AccountNumber

  @JsonProperty
  @Size(0, 40)
  private var _policyNumber : String as PolicyNumber

  @JsonProperty
  @Required
  private var _lossDate : Date as LossDate

  @JsonProperty
  private var _companyName : String as CompanyName
  
  @JsonProperty
  private var _firstName : String as FirstName
  
  @JsonProperty
  private var _lastName : String as LastName
  
  @JsonProperty
  private var _policyType : typekey.PolicyType as PolicyType
  
  @JsonProperty
  private var _city : String as City
  
  @JsonProperty  @FilterByCategory("Country")
  private var _state : typekey.State as State
  
  @JsonProperty
  private var _zip : String as Zip

  @JsonProperty
  private var _country : typekey.Country as Country

  // Not to be sent back to end user
  private var _producerCode: String as ProducerCode
}
