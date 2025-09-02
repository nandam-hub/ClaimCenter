package wsi.remote.gw

uses gw.plugin.credentials.Keys


@Export
class GWCCConfigurationProvider extends GWInterAppConfigurationProvider {

  construct() {
    super(Keys.SUITE_CC_INTEGRATION, "CC", {})
  }

  override property get UseOauth() : boolean {
    return false
  }
}