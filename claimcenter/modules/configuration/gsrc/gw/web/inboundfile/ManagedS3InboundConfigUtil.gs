package gw.web.inboundfile

uses gw.plugin.Plugins
uses gw.plugin.inboundfile.IManagedS3InboundConfig

@SuppressWarnings("HiddenPackageReference")
class ManagedS3InboundConfigUtil {

  private var inboundConfigPlugin : IManagedS3InboundConfig

  construct() {
    inboundConfigPlugin = Plugins.get("InboundConfigPlugin") as IManagedS3InboundConfig
  }

  function fillManagedValues(config : InboundS3FileConfig) : void {
    config.InputS3Bucket = inboundConfigPlugin.getS3BucketName()
    config.ArchiveS3Bucket = inboundConfigPlugin.getS3BucketName()
    config.InputS3Prefix = "${inboundConfigPlugin.getS3InputPrefix()}/${config.getName()}"
    config.ArchiveS3Prefix = "${inboundConfigPlugin.getS3ArchivePrefix()}/${config.getName()}"
  }
}