package edge.capabilities.extusermgmt.resetpassword.local

uses java.lang.IllegalArgumentException
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordResetDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.uaaoperations.uaaclient.UaaOAuthClientBuilder
uses edge.capabilities.extusermgmt.resetpassword.dto.PasswordCodeDTO
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.entity.ContentType
uses org.apache.http.entity.StringEntity
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordRequestDTO
uses edge.capabilities.extusermgmt.resetpassword.dto.NewPasswordResponseDTO
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.uaaoperations.uaaclient.UaaConnectionException

class DefaultResetPasswordPlugin implements ResetPasswordPlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultResetPasswordPlugin))

  private static final var PWD_MGMT_CLIENT = "pwdmgmt"

  private var _uaaClientConnection: UaaOAuthClientBuilder.UaaConnection

  @ForAllGwNodes
  construct() {
    try {
      _uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(PWD_MGMT_CLIENT, true)
    } catch( e: UaaConnectionException) {
      _logger.logWarn("Unable to connect to UAA on startup. Another connection attempt will be made at the time of the request")
    }
  }

  override function sendPasswordToken(passwordResetDTO: PasswordResetDTO):PasswordCodeDTO {
    if (_uaaClientConnection == null) {
      _uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(PWD_MGMT_CLIENT, true)
    }
    if (passwordResetDTO == null || passwordResetDTO.Email == null || passwordResetDTO.NewPasswordEntryUrl == null) {
      throw new IllegalArgumentException("Password reset data missing required fields")
    }

    var postRequest = new HttpPost(ScriptParameters.AuthServerUrl+"/password_resets")
    postRequest.addHeader("Content-Type", ContentType.APPLICATION_JSON as String)

    postRequest.setEntity(new StringEntity(passwordResetDTO.Email))
    return _uaaClientConnection.httpPost<String, PasswordCodeDTO>(postRequest, passwordResetDTO.Email);
  }

  override function setNewPassword(newPasswordRequestDTO: NewPasswordRequestDTO): NewPasswordResponseDTO {
    if (_uaaClientConnection == null) {
      _uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(PWD_MGMT_CLIENT, true)
    }
    return _uaaClientConnection.httpPost<NewPasswordRequestDTO, NewPasswordResponseDTO >("/password_change", newPasswordRequestDTO);
  }

}
