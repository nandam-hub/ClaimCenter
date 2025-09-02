package edge.capabilities.claim.lob.shared.incidents.dto

uses edge.aspects.validation.Validation
uses edge.aspects.validation.annotations.FilterByCategory
uses edge.aspects.validation.annotations.Required
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.capabilities.claim.lob.shared.incidents.dto.BodyPartDTO
uses edge.el.Expr
uses edge.jsonmapper.JsonProperty

class InjuryIncidentDTO {

  @JsonProperty
  var _publicId : String as PublicID

  @JsonProperty
  var _description : String as Description

  @JsonProperty
  var _injured : ContactDTO as Injured

  @JsonProperty
  var _generalInjuryType : InjuryType as GeneralInjuryType

  @JsonProperty
  @FilterByCategory("GeneralInjuryType")
  var _detailedInjuryType : DetailedInjuryType as DetailedInjuryType

  @JsonProperty
  var _bodyParts : BodyPartDTO[] as BodyParts
}
