package edge.capabilities.claim.details.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.contact.dto.ContactDTO

class ClaimReporterDTO {
  @JsonProperty
  var _reportedBy : ContactDTO as ReportedBy
  
  @JsonProperty
  var _relationToInsured : typekey.PersonRelationType as RelationToInsured

}
