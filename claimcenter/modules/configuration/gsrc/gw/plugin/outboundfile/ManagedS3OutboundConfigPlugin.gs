package gw.plugin.outboundfile

uses com.guidewire.properties.iofile.AbstractConfigFileLoadingPlugin
uses com.guidewire.properties.iofile.ConfigFileLoader
uses gw.api.server.Availability
uses gw.api.server.AvailabilityLevel
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.ManagedS3OutboundConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundConfigurationBase
uses org.apache.commons.lang3.StringUtils

@SuppressWarnings("HiddenPackageReference")
@Availability(AvailabilityLevel.MAINTENANCE)
public class ManagedS3OutboundConfigPlugin extends AbstractConfigFileLoadingPlugin<OutboundFileConfig, OutboundConfigurationBase> implements IManagedS3OutboundConfig {

  private static final var CONFIG_FILE_LOCATION = "config/outbound/OutboundFileConfiguration.xml"
  private static final var S3_BUCKET_NAME_PARAM = "s3BucketName"
  private static final var S3_OUTPUT_PREFIX_PARAM = "s3OutputPrefix"
  private static final var TMP_DIR_PARAM = "temporaryDir"

  private var s3BucketName : String
  private var s3OutputPrefix : String
  private var temporaryDir : String

  protected function init() : void {
    context = new ManagedS3OutboundConfigContext(s3BucketName, s3OutputPrefix, temporaryDir)
    loader = new ConfigFileLoader<OutboundFileConfig, OutboundConfigurationBase>(context)
    configFileLocation = CONFIG_FILE_LOCATION
  }

  override public property set Parameters(params : Map) : void {
    super.setParameters(params)
    s3BucketName = params.get(S3_BUCKET_NAME_PARAM) as String
    var s3OutputPrefixParamValue = params.get(S3_OUTPUT_PREFIX_PARAM) as String
    s3OutputPrefix = StringUtils.stripEnd(s3OutputPrefixParamValue, "/")
    var tmpDirPrefixParamValue = params.get(TMP_DIR_PARAM) as String
    temporaryDir = StringUtils.isBlank(tmpDirPrefixParamValue) || tmpDirPrefixParamValue =="\${PLUGIN_OUTBOUND_TEMP_DIR}"
        ? System.getProperty("java.io.tmpdir") : tmpDirPrefixParamValue
  }

  override function getS3BucketName() : String {
    return s3BucketName
  }

  override function getS3OutputPrefix() : String {
    return s3OutputPrefix
  }

  override function getTemporaryDir() : String {
    return temporaryDir
  }
}