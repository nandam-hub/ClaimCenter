package edge.capabilities.extusermgmt.resetpassword.dto

uses edge.jsonmapper.JsonProperty

class NewPasswordRequestDTO {

  construct() {}

  construct(pwdCode: String, newPassword: String) {
    this._code = pwdCode
    this._new_password = newPassword
  }

  @JsonProperty
  private var _code: String as code

  @JsonProperty
  private var _new_password: String as new_password

}
