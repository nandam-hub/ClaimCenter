package edge.capabilities.claim.lob.impl.commercialproperty.fnol.dto

uses edge.aspects.validation.annotations.Currency
uses edge.aspects.validation.annotations.Range
uses edge.aspects.validation.annotations.Required
uses edge.aspects.validation.annotations.Size
uses edge.capabilities.claim.fnol.metadata.validation.annotations.FilterByCurrency
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty
uses java.lang.Integer
uses java.math.BigDecimal

/**
 * Shared information about fixed property incident. This incident may be used by different
 * LOBs like Personal auto and homeowners.
 */
class CPFixedPropertyIncidentDTO {

  @JsonProperty
  var _publicId : String as PublicID
  
  @JsonProperty @Size(0, 1333)
  var _description : String as Description
    
  @JsonProperty @Size(0, 1333)
  var _propertyDescription : String as PropertyDescription

  @JsonProperty
  @Required
  var _location : String as Location

  @JsonProperty
  var _estimateReceived : YesNo as EstimateReceived

  @JsonProperty
  @Currency
  @Range(new BigDecimal(0), new BigDecimal(1000000000000))
  var _estRepairCost : BigDecimal as EstRepairCost

  @JsonProperty
  var _estRepairTime : String as EstRepairTime

  @JsonProperty
  @FilterByCurrency
  var _estDamage : EstDamageType as EstDamage

  @JsonProperty
  @Currency
  @Range(new BigDecimal(0), new BigDecimal(1000000000000))
  var _estLoss : BigDecimal as LossEstimate

  @JsonProperty
  var _alreadyRepaired : Boolean as AlreadyRepaired

  @JsonProperty
  var _classType : ClassType as ClassType

  @JsonProperty
  @Range(0, 200)
  var _numStories : Integer as NumStories

  @JsonProperty
  var _rootMaterial : RoofMaterial as RoofMaterial

  @JsonProperty
  var _extWallMat : ExtWallMat as ExtWallMat

  @JsonProperty
  var _typeOfOccupancy : OccupancyType as TypeOfOccupancy

  @JsonProperty
  var _lossArea : LossArea as LossArea
}
