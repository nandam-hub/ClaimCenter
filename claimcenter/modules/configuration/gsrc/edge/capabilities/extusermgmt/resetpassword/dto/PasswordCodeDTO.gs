package edge.capabilities.extusermgmt.resetpassword.dto

uses edge.jsonmapper.JsonProperty

class PasswordCodeDTO {
  @JsonProperty
  private var _code: String as code

  @JsonProperty
  private var _user_id: String as user_id

}
