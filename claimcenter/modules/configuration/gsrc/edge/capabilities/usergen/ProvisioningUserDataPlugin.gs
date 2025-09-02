package edge.capabilities.usergen

uses com.guidewire.pl.system.dependency.PLDependencies
uses edge.util.helper.UserUtil
uses gw.api.data.PortalsProvider
uses gw.api.data.RoleProvider
uses gw.api.data.UserProvider
uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.api.system.PLConfigParameters
uses edge.PlatformSupport.Logger
uses gw.command.Import

@Availability(AvailabilityLevel.MULTIUSER)
@Distributed
class ProvisioningUserDataPlugin implements IStartablePlugin {

  final var LOGGER = new Logger(ProvisioningUserDataPlugin.Type.QName)
  var _state = StartablePluginState.Stopped;
  var _callbackHandler: StartablePluginCallbackHandler;

  override property get State(): StartablePluginState {
    return _state
  }

  override function start(callbackHandler: StartablePluginCallbackHandler, isStarting: boolean): void {
    _callbackHandler = callbackHandler
    _callbackHandler.execute(\-> {
      _state = StartablePluginState.Started
      LOGGER.logDebug("CC: Sample data plugin started")

      if(!isProductionServer()) {
        LOGGER.logDebug("CC: User Data Plugin running on non production env")

        // Sample Data
        if(!checkSampleData()) {
          if(loadXCenterSampleData()) {
            LOGGER.logDebug("CC: Sample Data has loaded successfully")
          } else {
            LOGGER.logDebug("CC: Sample Data has not loaded")
          }
        } else {
          LOGGER.logDebug("CC: Sample Data has already been loaded")
        }

        // PU User
        if(!checkPuUser()) {
          if(loadPuUser()) {
            LOGGER.logDebug("CC: PU User has been loaded successfully")
          } else {
            LOGGER.logDebug("CC: PU User has not been loaded")
          }
        } else {
          LOGGER.logDebug("CC: PU User has already been loaded")
        }
      }

    })
  }

  override function stop(isShuttingDown: boolean): void {
    _callbackHandler.log("Sample data plugin stopped")
    _callbackHandler = null
    _state = StartablePluginState.Stopped
  }

  // Find xCenter and load sample data
  private function loadXCenterSampleData(): boolean {

    try {
      LOGGER.logDebug("CC: Loading CC Sample data... ")
      var importData = new Import()
      importData.withDefault()
    } catch (e : Exception) {
      LOGGER.logError("CC: Sample Data could not be loaded: " + e)
      return false
    }
    return true
  }

  // Check for Sample Data
  private function checkSampleData(): Boolean {
    var user = new UserUtil().getUserByName("aapplegate");
    if(user === null) {
      return false
    }

    return true
  }

  // Check for PU User
  private function checkPuUser(): Boolean {
    var user = new UserUtil().getUserByName("pu");
    if(user === null) {
      return false
    }

    return true
  }


  private function loadPuUser(): boolean {
    try {
      var roleProvider = new RoleProvider()
      if (!roleProvider.AlreadyLoaded) {
        roleProvider.load()
      }

      var userProvider = new UserProvider()
      if (!userProvider.AlreadyLoaded) {
        userProvider.load()
      }
    } catch (e: Exception) {
      LOGGER.logError("CC: PU User has not been loaded: " + e)
      return false
    }
    return true
  }

  /**
   * Checks the environment of the server (Prod, preprod, dev, etc.).
   **/
  private static function isProductionServer() : Boolean {
    return PLDependencies.getServerMode().isProduction()
  }

}