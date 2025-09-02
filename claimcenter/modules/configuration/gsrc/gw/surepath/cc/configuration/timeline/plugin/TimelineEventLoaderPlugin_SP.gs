package gw.surepath.cc.configuration.timeline.plugin

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.api.system.server.ServerModeUtil
uses gw.plugin.InitializablePlugin
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * TODO: This is a stub data importer implementation to support auto-import of eligible events to be displayed on screen
 * We will replace this implementation with the refactored Data Importer/Exporter feature when it is ready
 */
@Availability(AvailabilityLevel.MULTIUSER)
class TimelineEventLoaderPlugin_SP implements IStartablePlugin, InitializablePlugin {

  static final var LOGGER = StructuredLogger.PLUGIN
  private var _callback : StartablePluginCallbackHandler
  private var _state = StartablePluginState.Stopped
  private var _params : Map<Object, Object>

  override function start(pluginCallbackHandler : StartablePluginCallbackHandler, serverStarting : boolean) {
    LOGGER.info("START: Starting TimelineEventLoaderPlugin_SP...")
    _callback = pluginCallbackHandler
    _state = StartablePluginState.Started
    if (this.DevelopmentOrTestEnvironment /*and runtime property indicates we should load admin data for claim timeline*/) {
      try {
        var alreadyEnteredTimelineEventTypes = Query.make(entity.TimelineEvent_SP)
            .select({QuerySelectColumns.path(Paths.make(TimelineEvent_SP#EventType))})
            .transformQueryRow(\row -> row.getColumn(0) as TimelineCategory_SP)
            .toSet()
        var allEligibleTimelineEventTypes = typekey.TimelineCategory_SP.getTypeKeys(false)
            .where(\potentialEventType -> not alreadyEnteredTimelineEventTypes
                .hasMatch(\alreadyEnteredEventType -> alreadyEnteredEventType == potentialEventType))
        for (aTimelineEventType in allEligibleTimelineEventTypes) {
          if (_state == StartablePluginState.Stopped) {
            LOGGER.info("The TimelineEventLoaderPlugin_SP was stopped - aborting data loading.")
            break
          }
          _callback.execute(\-> {
            gw.transaction.Transaction.runWithNewBundle(\bundle -> {
              var newTimelineEventRecord = new TimelineEvent_SP(bundle)
              newTimelineEventRecord.EventType = aTimelineEventType
              newTimelineEventRecord.EffectiveDate = Date.Today
              newTimelineEventRecord.InUse = false
            }, User.util.UnrestrictedUser)
          }, User.util.UnrestrictedUser)
        }
      } catch (ex: Exception) {

      } finally {
        LOGGER.info("END: Starting TimelineEventLoaderPlugin_SP")
      }
    } else {
      if (not this.DevelopmentOrTestEnvironment) {
        LOGGER.warn("TimelineEventLoaderPlugin_SP is not enabled for PROD environments!!!", TimelineEventLoaderPlugin_SP#start(StartablePluginCallbackHandler, boolean));
      }
    }
  }

  override function stop(serverShuttingDown : boolean) {
    LOGGER.info("Stopping TimelineEventLoaderPlugin_SP...")
    _state = StartablePluginState.Stopped
  }

  override property get State() : StartablePluginState {
    return _state
  }

  override property set Parameters(map : Map) {
    _params = map
  }

  private property get DevelopmentOrTestEnvironment() : boolean {
    return ServerModeUtil.Dev or ServerModeUtil.Test
  }
}