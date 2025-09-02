package edge.capabilities.extusermgmt.resetpassword

uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.capabilities.extusermgmt.resetpassword.local.ResetPasswordPlugin
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordResetDTO
uses edge.capabilities.extusermgmt.resetpassword.local.ResetPasswordMailingPlugin
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordRequestDTO
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordResponseDTO
uses edge.di.annotations.InjectableNode
uses java.util.regex.Pattern
uses java.lang.Exception

class ResetPasswordHandler extends AbstractRpcHandler {

  private var _resetPasswordPlugin : ResetPasswordPlugin

  private var _resetPasswordMailingPlugin : ResetPasswordMailingPlugin

  @InjectableNode
  @Param("resetPasswordPlugin", "Plugin that get a code to change their password")
  @Param("resetPasswordMailingPlugin", "Plugin that emails a client a link with a code to change their password")
  construct(resetPasswordPlugin: ResetPasswordPlugin, resetPasswordMailingPlugin: ResetPasswordMailingPlugin) {
    _resetPasswordPlugin = resetPasswordPlugin
    _resetPasswordMailingPlugin = resetPasswordMailingPlugin
  }

  /**
   * Validates the resetPasswordURL against a list of RegExes
   */
  private function validateResetPasswordURL (url: String = "") {
    var pattern = Pattern.compile(ScriptParameters.AllowedResetPasswordUrls)
    if(pattern.matcher(url).find()) {
      return
    }
    throw new Exception("Cannot send reset token. Invalid URL")
  }



  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Send the password token.")
  @ApidocAvailableSince("6.0")
  public function sendPasswordToken(passwordReset: PasswordResetDTO){
    validateResetPasswordURL(passwordReset.NewPasswordEntryUrl)
    var passwordCode = _resetPasswordPlugin.sendPasswordToken(passwordReset);
    //email user the link to reset password
    _resetPasswordMailingPlugin.sendMail(passwordReset, passwordCode)
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Create new password.")
  @ApidocAvailableSince("6.0")
  public function newPassword(newPasswordDTO: NewPasswordRequestDTO): NewPasswordResponseDTO{
    return _resetPasswordPlugin.setNewPassword(newPasswordDTO)
  }
}
