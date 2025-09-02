package edge.uaaoperations

uses edge.di.annotations.ForAllGwNodes
uses edge.uaaoperations.uaaclient.UaaOAuthClientBuilder
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.uaaoperations.uaaclient.UaaConnectionException
uses java.lang.IllegalArgumentException
uses edge.uaaoperations.uaaclient.dto.UaaClientConfigDTO
uses edge.uaaoperations.dto.CheckTokenResponseDTO
uses java.lang.Exception

class DefaultUaaTokenOperationsPlugin implements UaaTokenOperationsPlugin {

  final private static var _logger = new Logger(Reflection.getRelativeName(DefaultUaaTokenOperationsPlugin))

  private static final var TKN_MGNT_CLIENT = "tokenmgmt"
  private var uaaClientConnection: UaaOAuthClientBuilder.UaaConnection

  @ForAllGwNodes
  construct() {
    try {
      setUAAConnection()
    } catch(e: UaaConnectionException) {
      _logger.logWarn("Unable to connect to UAA on startup. Another connection attempt will be made at the time of the request")
    }
  }

  construct(uaaConnection: UaaOAuthClientBuilder.UaaConnection)  {
    uaaClientConnection = uaaConnection
  }

  override function validateToken(token: String): Boolean {
    if (token == null) {
      throw new IllegalArgumentException("Token must be set")
    }

    try{
      uaaClientConnection.httpPostBasicAuth<String, CheckTokenResponseDTO>("/check_token", token)
    }
    catch (e : Exception){
      return false;
    }

    return true;
  }

  private function setUAAConnection() {
    if (uaaClientConnection == null) {
      uaaClientConnection = UaaOAuthClientBuilder.getUAAConnection(TKN_MGNT_CLIENT, false)
    }
  }

}

