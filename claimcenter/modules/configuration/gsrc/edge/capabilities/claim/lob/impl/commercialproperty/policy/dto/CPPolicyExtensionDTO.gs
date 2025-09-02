package edge.capabilities.claim.lob.impl.commercialproperty.policy.dto

uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.Ensure
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.LocationDTO
uses edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto.PropertyRiskUnitDTO
uses edge.capabilities.claim.lob.policy.dto.IPolicyLobExtensionDTO
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty

class CPPolicyExtensionDTO implements IPolicyLobExtensionDTO {

  @JsonProperty
  @Ensure(
      Expr.greaterThan(Expr.getProperty("PropertyRiskUnits.length", Validation.PARENT), 0),
      Expr.translate("Edge.Web.CommercialProperty.AtLeastOneBuilding",{}))
  var _propertyRiskUnits : PropertyRiskUnitDTO[] as PropertyRiskUnits

  @JsonProperty
  var _locations : LocationDTO[] as Locations
}
