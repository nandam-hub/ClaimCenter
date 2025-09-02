package gw.surepath.cc.integration.preupdate

uses gw.api.preupdate.PreUpdateContext
uses gw.plugin.InitializablePlugin
uses gw.plugin.preupdate.IPreUpdateHandler
uses gw.plugin.preupdate.impl.CCPreupdateHandlerImpl
uses gw.surepath.suite.integration.preupdate.SurePathPreUpdateHandler

/**
 * Extend the out of the box plugin implementation, then delegate to the SurePath implementation.
 */
class CCSurePathPreupdateHandler extends CCPreupdateHandlerImpl implements IPreUpdateHandler, InitializablePlugin {
  private var _surePathHandler : SurePathPreUpdateHandler

  construct() {
    _surePathHandler = new SurePathPreUpdateHandler()
  }

  override function executePreUpdate(preUpdateContext : PreUpdateContext) {
    super.executePreUpdate(preUpdateContext)
    _surePathHandler.executePreUpdate(preUpdateContext)
  }

  override property set Parameters(map : Map<Object, Object>) {
    _surePathHandler.Parameters = map
  }
}