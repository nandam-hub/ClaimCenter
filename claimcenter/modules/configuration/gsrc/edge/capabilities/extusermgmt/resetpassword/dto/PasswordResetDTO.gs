package edge.capabilities.extusermgmt.resetpassword.dto

uses edge.jsonmapper.JsonProperty

class PasswordResetDTO {

  construct() {}

  construct(_email: String, _newPasswordEntryUrl: String) {
    this.email = _email
    this.newPasswordEntryUrl = _newPasswordEntryUrl
  }

  @JsonProperty
  private var email: String as Email

  @JsonProperty
  private var newPasswordEntryUrl: String as NewPasswordEntryUrl

}
