package wsi.remote.gw

uses gw.wsi.pl.GWTimeoutConfigurationProvider

/**
 * This will set the timeout to 10 minutes.  But customer should evaluate their endpoints and
 * determine if a more reasonable value is appropriate.
 */
@Export
class GWTimeoutConfigProvider extends GWTimeoutConfigurationProvider {

  construct() {
    super(600000)
  }
}