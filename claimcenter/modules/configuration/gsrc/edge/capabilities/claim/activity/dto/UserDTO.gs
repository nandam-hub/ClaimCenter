package edge.capabilities.claim.activity.dto

uses edge.jsonmapper.JsonProperty

class UserDTO {

  @JsonProperty  
  var _firstName: String as FirstName

  @JsonProperty
  var _lastName: String as LastName
  
  @JsonProperty
  var _publicID: String as PublicID  
}
