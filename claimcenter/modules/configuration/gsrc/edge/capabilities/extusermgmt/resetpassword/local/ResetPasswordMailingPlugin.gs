package edge.capabilities.extusermgmt.resetpassword.local

uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordResetDTO
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordCodeDTO

interface ResetPasswordMailingPlugin {
  public function sendMail(resetPasswordDTO : PasswordResetDTO, passwordCode: PasswordCodeDTO)
}
