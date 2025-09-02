package edge.capabilities.claim.policy.dto

uses edge.jsonmapper.JsonProperty
uses java.util.Date
uses edge.capabilities.currency.dto.AmountDTO

/**
 * Pepresents the different subtypes of a coverage. 
 */
class CoverageDTO {
  @JsonProperty
  var _name : String as Name  
  
  @JsonProperty
  var _effectiveDate : Date as EffectiveDate
  
  @JsonProperty
  var _expirationDate : Date as ExpirationDate
  
  @JsonProperty
  var _exposureLimit : AmountDTO as ExposureLimit
  
  @JsonProperty
  var _incidentLimit : AmountDTO as IncidentLimit
  
  @JsonProperty
  var _deductible : AmountDTO as Deductible

}
