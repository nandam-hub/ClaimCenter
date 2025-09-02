package edge.capabilities.claim.lob.shared.incidents.dto

uses edge.capabilities.claim.lob.shared.incidents.annotations.RequiredSideOfBody
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.aspects.validation.annotations.Range
uses edge.aspects.validation.annotations.Required
uses edge.jsonmapper.JsonProperty

class BodyPartDTO {
  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty
  @Required
  var _primaryBodyPart : typekey.BodyPartType as PrimaryBodyPart

  @JsonProperty
  @Required
  @FilterByCategory("PrimaryBodyPart")
  var _detailedBodyPart : typekey.DetailedBodyPartType as DetailedBodyPart

  @JsonProperty
  @FilterByCategory("DetailedBodyPart")
  var _detailedBodyPartDesc : typekey.DetailedBodyPartDesc as DetailedBodyPartDesc

  @JsonProperty
  @RequiredSideOfBody
  var _sideOfBody : typekey.SideOfBody as SideOfBody

  @JsonProperty
  @Range(0, 100)
  var _impairmentPercentage : Integer as ImpairmentPercentage
}
