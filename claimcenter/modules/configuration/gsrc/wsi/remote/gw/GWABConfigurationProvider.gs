package wsi.remote.gw

uses gw.plugin.credentials.Keys

@Export
class GWABConfigurationProvider extends GWInterAppConfigurationProvider {

  construct() {
    super(Keys.SUITE_AB_INTEGRATION, "AB", {})
  }

  override property get UseOauth() : boolean {
    return false
  }
}