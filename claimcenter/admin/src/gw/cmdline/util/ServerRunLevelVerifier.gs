package gw.cmdline.util;

uses gw.api.server.AvailabilityLevel
uses gw.api.system.server.Runlevel
uses gw.wsi.pl.serverstateapi.ServerStateAPI

uses java.net.URL


public class ServerRunLevelVerifier {

  /**
   * Checks whether the current server run level is equal or above MAINTENANCE
   * @param server The root server URL to access
   * @param user The user to log in as
   * @param password The password to use
   * @param errorMessage uses the error message to log if the server run level is below the MAINTENANCE
   */
  static function confirmRunLevelMaintenance(server: String, user: String, password: String, errorMessage: String) {
    try {
      var serverStateConfig = new gw.xml.ws.WsdlConfig()
      serverStateConfig.ServerOverrideUrl = new URL(server + "/ws/gw/wsi/pl/ServerStateAPI").toURI() as String
      serverStateConfig.Guidewire.Authentication.Username = user
      serverStateConfig.Guidewire.Authentication.Password = password
      var serverStateAPI = new ServerStateAPI(serverStateConfig)
      var stateInfo = serverStateAPI.getServerState()
      if (Runlevel.getRunlevel(stateInfo.RunLevelName) == Runlevel.SHUTDOWN and stateInfo.StartupException != null) {
        throw new RuntimeException("${errorMessage}\nStartup Exception = ${stateInfo.StartupException}")
      } else if (Runlevel.getRunlevel(stateInfo.RunLevelName).isEarlier(AvailabilityLevel.MAINTENANCE.Runlevel)) {
        throw new RuntimeException("${errorMessage} Please check the server logs for the information.")
      }
    } catch (e: gw.wsi.pl.serverstateapi.faults.WsiAuthenticationException) {
      if (e.Message.startsWith("The server must be at NODAEMONS runlevel or greater")) {
        print("${errorMessage} Please check the server logs for the information.")
      } else {
        print(e.getMessage())
      }
      System.exit(1)
    } catch (e) {
      print(e.getMessage())
      System.exit(1)
    }
  }
}
