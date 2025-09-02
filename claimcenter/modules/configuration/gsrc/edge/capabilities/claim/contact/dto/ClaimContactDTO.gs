package edge.capabilities.claim.contact.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/**
 * Information about claim contact.
 */
class ClaimContactDTO {

  @JsonProperty  
  var _publicID : String as PublicID
  
  @JsonProperty @Required
  var _contactDTO : ContactDTO as ContactDTO
  
  @JsonProperty
  var _contactRoles : typekey.ContactRole[] as ContactRoles
  
  @JsonProperty
  var _contactRolesDisplay : String[] as ContactRolesDisplay
}
