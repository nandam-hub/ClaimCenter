package edge.capabilities.extusermgmt.resetpassword.local

uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordResetDTO
uses gw.plugin.Plugins
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses gw.api.email.EmailContact
uses gw.api.email.EmailUtil
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordCodeDTO
uses edge.di.annotations.ForAllGwNodes
uses resources.emailtemplates.ForgotPasswordEmailPortal
uses edge.PlatformSupport.TranslateUtil

class DefaultResetPasswordMailingPlugin implements ResetPasswordMailingPlugin {

  private static final var SENDER_EMAIL : String = "resetpassword@guidewire.com"

  private static final var SENDER_NAME : String = "Reset Password [Guidewire]"

  @ForAllGwNodes
  construct() {
  }

  override function sendMail(resetPasswordDTO: PasswordResetDTO, passwordCode: PasswordCodeDTO) {
    if (!Plugins.isEnabled("emailMessageTransport")){
      throw new JsonRpcInternalErrorException(){:Message = "Email plugin is not enabled. Please contact the administrator to enable the email plugin."}
    }

    var email = new gw.api.email.Email()

    email.addToRecipient(new EmailContact(resetPasswordDTO.Email, ""))
    email.Sender = new EmailContact(SENDER_EMAIL, SENDER_NAME);
    email.Html = true

    var temp = ForgotPasswordEmailPortal.renderToString(resetPasswordDTO.Email, resetPasswordDTO.NewPasswordEntryUrl, passwordCode.code)
    email.setBody(temp)
    email.setSubject(TranslateUtil.translate('Edge.Web.ResetPassword.local.DefaultResetPasswordMailingPlugin.ForgotPassword'))
    EmailUtil.sendEmailWithBody(null, email)
  }
}
