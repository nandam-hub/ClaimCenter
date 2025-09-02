package gw.plugin.inboundfile

uses com.guidewire.properties.iofile.AbstractConfigFileLoadingPlugin
uses com.guidewire.properties.iofile.ConfigFileLoader
uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundConfigurationBase
uses org.apache.commons.lang3.StringUtils

@SuppressWarnings("HiddenPackageReference")
@Availability(AvailabilityLevel.MAINTENANCE)
public class ManagedS3InboundConfigPlugin extends AbstractConfigFileLoadingPlugin<InboundFileConfig, InboundConfigurationBase> implements IManagedS3InboundConfig {

  private static final var CONFIG_FILE_LOCATION = "config/inbound/InboundFileConfiguration.xml"
  private static final var S3_BUCKET_NAME_PARAM = "s3BucketName"
  private static final var S3_INPUT_PREFIX_PARAM = "s3InputPrefix"
  private static final var S3_ARCHIVE_PREFIX_PARAM = "s3ArchivePrefix"

  private var s3BucketName : String
  private var s3InputPrefix : String
  private var s3ArchivePrefix : String

  protected function init() : void {
    context = new ManagedS3InboundConfigContext(s3BucketName, s3InputPrefix, s3ArchivePrefix)
    loader = new ConfigFileLoader<InboundFileConfig, InboundConfigurationBase>(context)
    configFileLocation = CONFIG_FILE_LOCATION
  }

  override public property set Parameters(params : Map) : void {
    super.setParameters(params)
    s3BucketName = params.get(S3_BUCKET_NAME_PARAM) as String
    var s3InputPrefixParamValue = params.get(S3_INPUT_PREFIX_PARAM) as String
    s3InputPrefix = StringUtils.stripEnd(s3InputPrefixParamValue, "/")
    var s3ArchivePrefixParamValue = params.get(S3_ARCHIVE_PREFIX_PARAM) as String
    s3ArchivePrefix = StringUtils.stripEnd(s3ArchivePrefixParamValue, "/")
  }

  override function getS3BucketName() : String {
    return s3BucketName
  }

  override function getS3InputPrefix() : String {
    return s3InputPrefix
  }

  override function getS3ArchivePrefix() : String {
    return s3ArchivePrefix
  }
}