package edge.capabilities.claim.details.dto

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Email
uses edge.aspects.validation.annotations.Size
uses edge.aspects.validation.annotations.Phone

class UserDTO {
  @JsonProperty
  var _displayName:String as DisplayName

  @JsonProperty  
  var _firstName: String as FirstName

  @JsonProperty
  var _lastName: String as LastName
  
  @JsonProperty @Email
  var _email:String as Email  
  
  @JsonProperty @Size(0, 30)
  @Phone
  var _phoneNumber:String as PhoneNumber

}
