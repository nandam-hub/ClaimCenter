package gw.plugin.inboundfile

uses com.guidewire.inboundfile.handler.InboundFileHandler
uses com.guidewire.properties.iofile.AbstractConfigFileContext
uses com.guidewire.properties.iofile.ConfigFileHandlerValidator
uses entity.InboundFileConfig
uses gw.api.database.Queries
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.InboundConfigurations
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundConfigurationBase
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundLocalConfiguration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundS3Configuration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.ManagedS3InboundConfiguration

uses java.io.File

@SuppressWarnings({"HiddenPackageReference"})
public class ManagedS3InboundConfigContext extends AbstractConfigFileContext<InboundFileConfig, InboundConfigurationBase> {

  private final var _s3BucketName : String
  private final var _s3InputPrefix : String
  private final var _s3ArchivePrefix : String

  construct(s3BucketName : String, s3InputPrefix : String, s3ArchivePrefix : String) {
    _s3BucketName = s3BucketName
    _s3InputPrefix = s3InputPrefix
    _s3ArchivePrefix = s3ArchivePrefix
  }

  override public function parseConfigFile(fileToRead : File) : List<InboundConfigurationBase> {
    var configs = InboundConfigurations.parse(fileToRead)
    return getConfigurations(configs)
  }

  private function getConfigurations(inboundConfigurations : InboundConfigurations) : List<InboundConfigurationBase> {
    var configs : List<InboundConfigurationBase>
    configs = inboundConfigurations.ManagedS3Configuration.map(\c -> c.$TypeInstance)
    configs.addAll(inboundConfigurations.LocalConfiguration.map(\c -> c.$TypeInstance))
    configs.addAll(inboundConfigurations.S3Configuration.map(\c -> c.$TypeInstance))

    configs.removeIf(\c -> isEnvironmentDifferentThanCurrent(c.getEnv()))

    return configs
  }

  override protected function validateConfigFileHandlerClass(xmlConfig : InboundConfigurationBase) : void {
    ConfigFileHandlerValidator.validate(xmlConfig.getFileHandlerClass(), InboundFileHandler)
  }

  override protected function findConfig(xmlConfig : InboundConfigurationBase) : Optional<InboundFileConfig> {
    var query = Queries.createQuery(InboundFileConfig.TYPE.get()) as Query<InboundFileConfig>
    query.compare(InboundS3FileConfig.NAME_PROP.get(), Relop.Equals, xmlConfig.getName())
    return Optional.ofNullable(query.select().getAtMostOneRow())
  }

  override protected function createConfigFromXml(xmlConfig : InboundConfigurationBase) : InboundFileConfig {
    var config = xmlConfig typeis InboundLocalConfiguration ? new InboundLocalFileConfig() : new InboundS3FileConfig() as InboundFileConfig
    copyValues(config, xmlConfig)

    return config
  }

  override protected function copyValues(config : InboundFileConfig, xmlConfig : InboundConfigurationBase) : void {
    copyConfigurableValues(config, xmlConfig)
    copySpecificValues(config, xmlConfig)
  }

  private function copyConfigurableValues(config : InboundFileConfig, xmlConfig : InboundConfigurationBase) : void {
    config.setName(xmlConfig.getName())
    config.setFileHandlerClass(xmlConfig.getFileHandlerClass())
    config.setChunkSize(xmlConfig.getChunkSize().intValue())
    config.setDaysTillPurge(xmlConfig.getDaysTillPurge().intValue())
  }

  private function copySpecificValues(config : InboundFileConfig, xmlConfig : InboundConfigurationBase) {
    switch (typeof xmlConfig) {
      case InboundLocalConfiguration:
        copyLocalValues(config as InboundLocalFileConfig, xmlConfig)
        break
      case InboundS3Configuration:
        copyS3Values(config as InboundS3FileConfig, xmlConfig)
        break
      case ManagedS3InboundConfiguration:
        setManagedS3Values(config as InboundS3FileConfig, xmlConfig.Name)
        break
    }
  }

  private function copyLocalValues(config : InboundLocalFileConfig, xmlConfig : InboundLocalConfiguration) {
    config.setInputDirectory(xmlConfig.getInputDirectory())
    config.setArchiveDirectory(xmlConfig.getArchiveDirectory())
  }

  private function copyS3Values(config : InboundS3FileConfig, xmlConfig : InboundS3Configuration) {
    config.setProfileName(xmlConfig.getProfileName())
    config.setInputS3Prefix(xmlConfig.getInputPrefix())
    config.setInputS3Bucket(xmlConfig.getInputBucketName())
    config.setArchiveS3Prefix(xmlConfig.getArchivePrefix())
    config.setArchiveS3Bucket(xmlConfig.getArchiveBucketName())
  }

  private function setManagedS3Values(config : InboundS3FileConfig, configName : String) : void {
    config.setInputS3Bucket(_s3BucketName)
    config.setArchiveS3Bucket(_s3BucketName)
    config.setInputS3Prefix("${_s3InputPrefix}/${configName}")
    config.setArchiveS3Prefix("${_s3ArchivePrefix}/${configName}")
  }

  private function isEnvironmentDifferentThanCurrent(env : String) : boolean {
    return env != null && env != CURRENT_ENVIRONMENT_NAME
  }
}