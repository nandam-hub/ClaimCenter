package gw.plugin.inboundfile

uses gw.api.test.CCUnitTestClassBase
uses gw.pl.util.FileUtil
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundConfigurationBase
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundLocalConfiguration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundS3Configuration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.ManagedS3InboundConfiguration
uses gw.suites.ManagedS3InboundConfigUnitSuite
uses gw.testharness.v3.Suites
uses org.apache.commons.lang3.RandomStringUtils
uses org.apache.commons.lang3.StringUtils

uses java.io.File
uses java.io.PrintWriter
uses java.math.BigInteger

@Suites(ManagedS3InboundConfigUnitSuite.NAME)
class ManagedS3InboundConfigContextUnitTest extends CCUnitTestClassBase {

  public function testParseConfigFile_AllConfigTypes() {
    //given
    var sampleManagedS3Config = new InboundManagedS3Config()
        .withName("managed-s3-integration")
        .withHandler("gw.SomeHandler")
        .withChunkSize(0)
        .withDaysTillPurge(0)

    var sampleLocalConfig = new InboundLocalConfig()
        .withInputDir("local-temp-dir")
        .withArchiveDir("archive")
        .withName("local-integration")
        .withHandler("gw.SomeHandler")
        .withChunkSize(0)
        .withDaysTillPurge(0)

    var sampleS3Config = new InboundS3Config()
        .withInputPrefix("s3-temp-dir")
        .withArchivePrefix("s3-temp-arch-dir")
        .withInputBucketName("some-bucket")
        .withArchiveBucketName("some-bucket")
        .withProfileName("some-profile-name")
        .withName("s3-integration")
        .withHandler("gw.SomeHandler")
        .withChunkSize(0)
        .withDaysTillPurge(0)

    var sampleConfigXml = createSampleInboundConfigXml({sampleManagedS3Config, sampleLocalConfig, sampleS3Config})

    var inputDir = createDir()
    var sampleConfigFile = createSampleInboundConfigFile(inputDir, "SampleConfig.xml", sampleConfigXml)

    var s3BucketName = "some-bucket"
    var s3OutputPrefix = "Output/prefix"
    var contextUnderTest = new ManagedS3InboundConfigContext(s3BucketName, s3OutputPrefix, inputDir.Name)

    //when
    var configs = contextUnderTest.parseConfigFile(sampleConfigFile)

    //then
    assertEquals("Expected three configurations", 3, configs.size())
    var managedS3Config = configs.whereTypeIs(ManagedS3InboundConfiguration.Type).single()
    assertEquals(ManagedS3InboundConfiguration.Type, sampleManagedS3Config, managedS3Config)
    var localConfig = configs.whereTypeIs(InboundLocalConfiguration.Type).single()
    assertEquals(InboundLocalConfiguration.Type, sampleLocalConfig, localConfig)
    var s3Config = configs.whereTypeIs(InboundS3Configuration.Type).single()
    assertEquals(InboundS3Configuration.Type, sampleS3Config, s3Config)

    //cleanup
    inputDir.delete()
  }

  public function testParseConfigFile_DifferentEnvironments() {
    //given
    var managedS3ConfigNoEnv = new InboundManagedS3Config()
        .withName("managed-s3-no-env")
        .withHandler("gw.SomeHandler")
        .withChunkSize(0)
        .withDaysTillPurge(0)

    var differentEnv = "some-other-env-123"
    var managedS3ConfigDifferentEnv = new InboundManagedS3Config()
        .withName("managed-s3-different-env")
        .withHandler("gw.SomeHandler")
        .withChunkSize(0)
        .withDaysTillPurge(0)
        .withEnv(differentEnv)

    var sampleConfigXml = createSampleInboundConfigXml({managedS3ConfigNoEnv, managedS3ConfigDifferentEnv})

    var dir = createDir()
    var sampleConfigFile = createSampleInboundConfigFile(dir, "SampleConfig.xml", sampleConfigXml)

    var s3BucketName = "some-bucket"
    var contextUnderTest = new ManagedS3InboundConfigContext(s3BucketName, dir.Name, dir.Name)

    //when
    var configs = contextUnderTest.parseConfigFile(sampleConfigFile)

    //then
    assertEquals("Expected one configuration", 1, configs.size())
    var configNoEnv = configs.singleWhere(\config -> StringUtils.isBlank(config.Env))
    assertEquals(ManagedS3InboundConfiguration.Type, managedS3ConfigNoEnv, configNoEnv)
    assertEquals("Unexpected the config with different environment parameter to be parsed", 0, configs.countWhere(\config -> config.Env == differentEnv))

    //cleanup
    dir.delete()
  }

  private function assertEquals(expectedType : Type, expectedConfig : InboundBaseConfig, actualConfig : InboundConfigurationBase) {
    assertEquals("Expected config to be of type ${expectedType.toString()}", expectedType, typeof actualConfig)
    assertEquals("Expected parsed config name to be the same as in the XML config", expectedConfig.Name, actualConfig.Name)
    assertEquals("Expected parsed config file handler to be the same as in the XML config", expectedConfig.Handler, actualConfig.FileHandlerClass)
    assertEquals("Expected parsed config chunk size parameter to be the same as in the XML config", expectedConfig.ChunkSize, actualConfig.ChunkSize)
    assertEquals("Expected parsed config days till purge parameter to be the same as in the XML config", expectedConfig.DaysTillPurge, actualConfig.DaysTillPurge.intValue())
    assertEquals("Expected parsed config prefix parameter to be the same as in the XML config", expectedConfig.Env, actualConfig.Env)
    if (actualConfig typeis InboundLocalConfiguration) {
      var expectedLocalConfig = expectedConfig as InboundLocalConfig
      var actualLocalConfig = actualConfig as InboundLocalConfiguration
      assertEquals("Expected parsed config input directory parameter to be the same as in the XML config", expectedLocalConfig.InputDir, actualLocalConfig.InputDirectory)
      assertEquals("Expected parsed config archive directory parameter to be the same as in the XML config", expectedLocalConfig.ArchiveDir, actualLocalConfig.ArchiveDirectory)
    } else if (actualConfig typeis InboundS3Configuration) {
      var expectedS3Config = expectedConfig as InboundS3Config
      var actualS3Config = actualConfig as InboundS3Configuration
      assertEquals("Expected parsed config input prefix parameter to be the same as in the XML config", expectedS3Config.InputPrefix, actualS3Config.InputPrefix)
      assertEquals("Expected parsed config archive prefix parameter to be the same as in the XML config", expectedS3Config.ArchivePrefix, actualS3Config.ArchivePrefix)
      assertEquals("Expected parsed config input bucket name parameter to be the same as in the XML config", expectedS3Config.InputBucketName, actualS3Config.ArchiveBucketName)
      assertEquals("Expected parsed config archive bucket name parameter to be the same as in the XML config", expectedS3Config.ArchiveBucketName, actualS3Config.ArchiveBucketName)
      assertEquals("Expected parsed config profile name parameter to be the same as in the XML config", expectedS3Config.ProfileName, actualS3Config.ProfileName)
    }
  }


  private function createSampleInboundConfigXml(configs : List<InboundBaseConfig>) : String {
    var configSb = new StringBuilder().append("<?xml version=\"1.0\"?>")
        .append("<InboundConfigurations xmlns=\"http://guidewire.com/inbound/ext\">")
    configs.map(\config -> config.toXmlString()).each(\config -> configSb.append(config))
    configSb.append("</InboundConfigurations>")
    return configSb.toString()
  }

  private function createDir() : File {
    var randomSuffix = RandomStringUtils.randomAlphabetic(5)
    return FileUtil.createTempDir("ManagedS3InboundConfigTest-${randomSuffix}")
  }

  private function createSampleInboundConfigFile(parentDir : File, name : String, content : String) : File {
    var configFile = new File(parentDir, name)
    var writer = new PrintWriter(configFile)
    try {
      writer.print(content)
    } finally {
      writer.close()
    }
    return configFile
  }

  private abstract static class InboundBaseConfig {
    protected var _name : String as readonly Name
    protected var _handler : String as readonly Handler
    protected var _chunkSize : BigInteger as readonly ChunkSize
    protected var _daysTillPurge : int as readonly DaysTillPurge
    protected var _env : String as readonly Env

    protected function withName(name : String) : InboundBaseConfig {
      _name = name
      return this
    }

    protected function withHandler(handler : String) : InboundBaseConfig {
      _handler = handler
      return this
    }

    protected function withChunkSize(chunkSize : BigInteger) : InboundBaseConfig {
      _chunkSize = chunkSize
      return this
    }

    protected function withDaysTillPurge(daysTillPurge : int) : InboundBaseConfig {
      _daysTillPurge = daysTillPurge
      return this
    }

    protected function withEnv(env : String) : InboundBaseConfig {
      _env = env
      return this
    }

    protected abstract function toXmlString() : String
  }

  private static class InboundLocalConfig extends InboundBaseConfig {
    private var _inputDir : String as InputDir
    private var _archiveDir : String as ArchiveDir

    public function withInputDir(inputDir : String) : InboundLocalConfig {
      _inputDir = inputDir
      return this
    }

    protected function withArchiveDir(archiveDir : String) : InboundLocalConfig {
      _archiveDir = archiveDir
      return this
    }

    protected override function toXmlString() : String {
      // It appears that Gosu lexer doesn't like mixing expressions like if-else with String formatting, hence the gimnastics
      var sb = new StringBuilder()
      sb.append("<LocalConfiguration")
      var openingTag = (StringUtils.isNotBlank(_env) ? sb.append(" env=\"").append(_env).append("\">") : sb.append(">")).toString()
      return openingTag +
          "  <Name>${_name}</Name>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <ChunkSize>${_chunkSize}</ChunkSize>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "  <InputDirectory>${_inputDir}</InputDirectory>" +
          "  <ArchiveDirectory>${_archiveDir}</ArchiveDirectory>" +
          "</LocalConfiguration>"
    }
  }

  private static class InboundS3Config extends InboundBaseConfig {
    private var _inputPrefix : String as InputPrefix
    private var _archivePrefix : String as ArchivePrefix
    private var _inputBucketName : String as InputBucketName
    private var _archiveBucketName : String as ArchiveBucketName
    private var _profileName : String as ProfileName

    function withInputPrefix(prefix : String) : InboundS3Config {
      _inputPrefix = prefix
      return this
    }

    function withArchivePrefix(prefix : String) : InboundS3Config {
      _archivePrefix = prefix
      return this
    }

    function withInputBucketName(bucketName : String) : InboundS3Config {
      _inputBucketName = bucketName
      return this
    }

    function withArchiveBucketName(bucketName : String) : InboundS3Config {
      _archiveBucketName = bucketName
      return this
    }

    function withProfileName(profileName : String) : InboundS3Config {
      _profileName = profileName
      return this
    }

    protected override function toXmlString() : String {
      // It appears that Gosu lexer doesn't like mixing expressions like if-else with String formatting, hence the gimnastics
      var sb = new StringBuilder()
      sb.append("<S3Configuration")
      var openingTag = (StringUtils.isNotBlank(_env) ? sb.append(" env=\"").append(_env).append("\">") : sb.append(">")).toString()
      return openingTag +
          "  <Name>${_name}</Name>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <ChunkSize>${_chunkSize}</ChunkSize>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "  <ProfileName>${_profileName}</ProfileName>" +
          "  <InputBucketName>${_inputBucketName}</InputBucketName>" +
          "  <InputPrefix>${_inputPrefix}</InputPrefix>" +
          "  <ArchiveBucketName>${_archiveBucketName}</ArchiveBucketName>" +
          "  <ArchivePrefix>${_archivePrefix}</ArchivePrefix>" +
          "</S3Configuration>"
    }
  }

  private static class InboundManagedS3Config extends InboundBaseConfig {

    protected override function toXmlString() : String {
      // It appears that Gosu lexer doesn't like mixing expressions like if-else with String formatting, hence the gimnastics
      var sb = new StringBuilder()
      sb.append("<ManagedS3Configuration")
      var openingTag = (StringUtils.isNotBlank(_env) ? sb.append(" env=\"").append(_env).append("\">") : sb.append(">")).toString()
      return openingTag +
          "  <Name>${_name}</Name>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <ChunkSize>${_chunkSize}</ChunkSize>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "</ManagedS3Configuration>"
    }
  }
}