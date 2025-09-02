package edge.capabilities.extusermgmt.resetpassword.dto

uses edge.jsonmapper.JsonProperty

class NewPasswordResponseDTO {

  @JsonProperty
  private var _username: String as username

  @JsonProperty
  private var _email: String as email

  @JsonProperty
  private var _code: String as code

  @JsonProperty
  private var _user_id: String as user_id
}
