package edge.capabilities.claim.fnol.dto

uses edge.jsonmapper.JsonProperty
uses edge.capabilities.claim.contact.dto.ContactDTO
uses edge.aspects.validation.annotations.Required

class FnolRelatedContactDTO {
  @JsonProperty // @ReadOnly
  var _publicID : String as PublicID
  
  @JsonProperty @Required
  var _role : typekey.ContactRole as Role
  
  @JsonProperty @Required
  var _injured : boolean as Injured
  
  @JsonProperty @Required
  var _contact : ContactDTO as Contact
}
