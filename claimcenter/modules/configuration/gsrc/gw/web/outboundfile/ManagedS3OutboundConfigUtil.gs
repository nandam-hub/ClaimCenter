package gw.web.outboundfile

uses gw.plugin.Plugins
uses gw.plugin.outboundfile.IManagedS3OutboundConfig

@SuppressWarnings("HiddenPackageReference")
class ManagedS3OutboundConfigUtil {

  private var outboundConfigPlugin : IManagedS3OutboundConfig

  construct() {
    outboundConfigPlugin = Plugins.get("OutboundConfigPlugin") as IManagedS3OutboundConfig
  }

  function fillManagedValues(config : OutboundFileS3Config) : void {
    config.DestinationS3Bucket = outboundConfigPlugin.getS3BucketName()
    config.DestinationS3Prefix = "${outboundConfigPlugin.getS3OutputPrefix()}/${config.getName()}"
    config.TemporaryDirectory = outboundConfigPlugin.getTemporaryDir()
  }
}