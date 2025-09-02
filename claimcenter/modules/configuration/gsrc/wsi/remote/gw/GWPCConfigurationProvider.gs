package wsi.remote.gw

uses gw.plugin.credentials.Keys


@Export
class GWPCConfigurationProvider extends GWInterAppConfigurationProvider {

  construct() {
    super(Keys.SUITE_PC_INTEGRATION, "PC", {})
  }

  override property get UseOauth() : boolean {
    return false
  }
}