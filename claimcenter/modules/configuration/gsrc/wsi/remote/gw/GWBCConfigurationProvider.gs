package wsi.remote.gw

uses gw.plugin.credentials.Keys

@Export
class GWBCConfigurationProvider extends GWInterAppConfigurationProvider {

  construct() {
    super(Keys.SUITE_BC_INTEGRATION, "BC", {})
  }

  override property get UseOauth() : boolean {
    return false
  }
}