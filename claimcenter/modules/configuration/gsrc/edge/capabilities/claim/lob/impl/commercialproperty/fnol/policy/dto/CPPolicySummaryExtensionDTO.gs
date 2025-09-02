package edge.capabilities.claim.lob.impl.commercialproperty.fnol.policy.dto

uses edge.capabilities.claim.lob.fnol.policy.dto.IPolicySummaryLobExtensionDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.PropertyRiskUnitDTO
uses edge.jsonmapper.JsonProperty

class CPPolicySummaryExtensionDTO implements IPolicySummaryLobExtensionDTO {

  @JsonProperty
  var _propertyRiskUnits : PropertyRiskUnitDTO[] as PropertyRiskUnits

}
