package gw.plugin.outboundfile

uses com.guidewire.outboundfile.OutboundFileHandler
uses com.guidewire.properties.iofile.AbstractConfigFileContext
uses com.guidewire.properties.iofile.ConfigFileHandlerValidator
uses gw.api.database.Queries
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.OutboundConfigurations
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.ManagedS3OutboundConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundConfigurationBase
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundLocalConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundS3Configuration

uses java.io.File

@SuppressWarnings({"HiddenPackageReference"})
public class ManagedS3OutboundConfigContext extends AbstractConfigFileContext<OutboundFileConfig, OutboundConfigurationBase> {

  private final var _s3BucketName : String
  private final var _s3OutputPrefix : String
  private final var _temporaryDir : String

  construct(s3BucketName : String, s3OutputPrefix : String, temporaryDir : String) {
    _s3BucketName = s3BucketName
    _s3OutputPrefix = s3OutputPrefix
    _temporaryDir = temporaryDir
  }

  override public function parseConfigFile(fileToRead : File) : List<OutboundConfigurationBase> {
    var configs = OutboundConfigurations.parse(fileToRead)
    return getConfigurations(configs)
  }

  private function getConfigurations(outboundConfigurations : OutboundConfigurations) : List<OutboundConfigurationBase> {
    var configs : List<OutboundConfigurationBase>
    configs = outboundConfigurations.ManagedS3Configuration.map(\c -> c.$TypeInstance)
    configs.addAll(outboundConfigurations.LocalConfiguration.map(\c -> c.$TypeInstance))
    configs.addAll(outboundConfigurations.S3Configuration.map(\c -> c.$TypeInstance))

    configs.removeIf(\c -> isEnvironmentDifferentThanCurrent(c.getEnv()))

    return configs
  }

  private function isEnvironmentDifferentThanCurrent(env : String) : boolean {
    return env != null && env != CURRENT_ENVIRONMENT_NAME;
  }

  override protected function validateConfigFileHandlerClass(xmlConfig : OutboundConfigurationBase) {
    ConfigFileHandlerValidator.validate(xmlConfig.getFileHandlerClass(), OutboundFileHandler)
  }

  override protected function findConfig(xmlConfig : OutboundConfigurationBase) : Optional<OutboundFileConfig> {
    var query = Queries.createQuery(OutboundFileConfig.TYPE.get()) as Query<OutboundFileConfig>
    query.compare(OutboundFileConfig.NAME_PROP.get(), Relop.Equals, xmlConfig.getName())
    return Optional.ofNullable(query.select().getAtMostOneRow())
  }

  override protected function createConfigFromXml(xmlConfig : OutboundConfigurationBase) : OutboundFileConfig {
    var config = xmlConfig typeis OutboundLocalConfiguration ? new OutboundFileLocalConfig() : new OutboundFileS3Config()
    copyValues(config, xmlConfig)
    return config
  }

  override protected function copyValues(config : OutboundFileConfig, xmlConfig : OutboundConfigurationBase) {
    copyConfigurableValues(config, xmlConfig)
    copySpecificValues(config, xmlConfig)
  }

  private function copyConfigurableValues(config : OutboundFileConfig, xmlConfig : OutboundConfigurationBase) {
    config.Name = xmlConfig.Name
    config.FileHandlerClass = xmlConfig.FileHandlerClass
    config.DaysTillPurge = xmlConfig.DaysTillPurge.intValue()
    config.Extension = xmlConfig.Extension
    config.Prefix = xmlConfig.Prefix
  }

  private function copySpecificValues(config : OutboundFileConfig, xmlConfig : OutboundConfigurationBase) {
    switch (typeof xmlConfig) {
      case OutboundLocalConfiguration:
        copyLocalValues(config as OutboundFileLocalConfig, xmlConfig)
        break
      case OutboundS3Configuration:
        copyS3Values(config as OutboundFileS3Config, xmlConfig)
        break
      case ManagedS3OutboundConfiguration:
        setManagedS3Values(config as OutboundFileS3Config, xmlConfig.Name)
        break
    }
  }

  private function copyLocalValues(config : OutboundFileLocalConfig, xmlConfig : OutboundLocalConfiguration) {
    config.TemporaryDirectory = xmlConfig.TemporaryDirectory
    config.PermanentDirectory = xmlConfig.PermanentDirectory
  }

  private function copyS3Values(config : OutboundFileS3Config, xmlConfig : OutboundS3Configuration) {
    config.TemporaryDirectory = xmlConfig.TemporaryDirectory
    config.ProfileName = xmlConfig.ProfileName
    config.DestinationS3Bucket = xmlConfig.PermanentBucketName
    config.DestinationS3Prefix = xmlConfig.PermanentPrefix
  }

  private function setManagedS3Values(config : OutboundFileS3Config, configName : String) {
    config.TemporaryDirectory = _temporaryDir
    config.DestinationS3Bucket = _s3BucketName
    config.DestinationS3Prefix = "${_s3OutputPrefix}/${configName}"
  }
}