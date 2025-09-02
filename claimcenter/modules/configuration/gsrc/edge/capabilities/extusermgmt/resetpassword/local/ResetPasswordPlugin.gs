package edge.capabilities.extusermgmt.resetpassword.local

uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordResetDTO
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordRequestDTO
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordCodeDTO
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordResponseDTO

interface ResetPasswordPlugin {

  /**
   * Send a email to user within the URL to update password
   * @param passwordResetDTO contains the code and email
   */
  function sendPasswordToken(passwordResetDTO: PasswordResetDTO): PasswordCodeDTO

  function setNewPassword(newPasswordDTO: NewPasswordRequestDTO): NewPasswordResponseDTO

}
