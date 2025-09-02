package gw.plugin.outboundfile

uses gw.api.system.server.ServerUtil
uses gw.api.test.CCUnitTestClassBase
uses gw.pl.util.FileUtil
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.ManagedS3OutboundConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundConfigurationBase
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundLocalConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundS3Configuration
uses gw.suites.ManagedS3OutboundConfigUnitSuite
uses gw.testharness.v3.Suites
uses org.apache.commons.lang3.RandomStringUtils
uses org.apache.commons.lang3.StringUtils

uses java.io.File
uses java.io.PrintWriter

@Suites(ManagedS3OutboundConfigUnitSuite.NAME)
class ManagedS3OutboundConfigContextUnitTest extends CCUnitTestClassBase {

  public function testParseConfigFile_AllConfigTypes() {
    //given
    var sampleManagedS3Config = new OutboundManagedS3Config()
        .withName("managed-s3-integration")
        .withHandler("gw.SomeHandler")
        .withDaysTillPurge(0)
        .withPrefix("pref")
        .withExtension("txt")

    var sampleLocalConfig = new OutboundLocalConfig()
        .withTempDir("local-temp-dir")
        .withPermDir("perm")
        .withName("local-integration")
        .withHandler("gw.SomeHandler")
        .withDaysTillPurge(0)
        .withPrefix("pref")
        .withExtension("txt")

    var sampleS3Config = new OutboundS3Config()
        .withTempDir("s3-temp-dir")
        .withBucketName("some-bucket")
        .withPrefixName("some-prefix")
        .withProfileName("some-profile-name")
        .withName("s3-integration")
        .withHandler("gw.SomeHandler")
        .withDaysTillPurge(0)
        .withPrefix("pref")
        .withExtension("txt")

    var sampleConfigXml = createSampleOutboundConfigXml({sampleManagedS3Config, sampleLocalConfig, sampleS3Config})

    var tempDir = createTempDir()
    var sampleConfigFile = createSampleOutboundConfigFile(tempDir, "SampleConfig.xml", sampleConfigXml)

    var s3BucketName = "some-bucket"
    var s3OutputPrefix = "Output/prefix"
    var contextUnderTest = new ManagedS3OutboundConfigContext(s3BucketName, s3OutputPrefix, tempDir.Name)

    //when
    var configs = contextUnderTest.parseConfigFile(sampleConfigFile)

    //then
    assertEquals("Expected three configurations", 3, configs.size())
    var managedS3Config = configs.whereTypeIs(ManagedS3OutboundConfiguration.Type).single()
    assertEquals(ManagedS3OutboundConfiguration.Type, sampleManagedS3Config, managedS3Config)
    var localConfig = configs.whereTypeIs(OutboundLocalConfiguration.Type).single()
    assertEquals(OutboundLocalConfiguration.Type, sampleLocalConfig, localConfig)
    var s3Config = configs.whereTypeIs(OutboundS3Configuration.Type).single()
    assertEquals(OutboundS3Configuration.Type, sampleS3Config, s3Config)

    //cleanup
    tempDir.delete()
  }

  public function testParseConfigFile_DifferentEnvironments() {
    //given
    var managedS3ConfigNoEnv = new OutboundManagedS3Config()
        .withName("managed-s3-no-env")
        .withHandler("gw.SomeHandler")
        .withDaysTillPurge(0)
        .withPrefix("pref")
        .withExtension("txt")

    var differentEnv = "some-other-env-123"
    var managedS3ConfigDifferentEnv = new OutboundManagedS3Config()
        .withName("managed-s3-different-env")
        .withHandler("gw.SomeHandler")
        .withDaysTillPurge(0)
        .withPrefix("pref")
        .withExtension("txt")
        .withEnv(differentEnv)

    var sampleConfigXml = createSampleOutboundConfigXml({managedS3ConfigNoEnv, managedS3ConfigDifferentEnv})

    var tempDir = createTempDir()
    var sampleConfigFile = createSampleOutboundConfigFile(tempDir, "SampleConfig.xml", sampleConfigXml)

    var s3BucketName = "some-bucket"
    var s3OutputPrefix = "Output/prefix"
    var contextUnderTest = new ManagedS3OutboundConfigContext(s3BucketName, s3OutputPrefix, tempDir.Name)

    //when
    var configs = contextUnderTest.parseConfigFile(sampleConfigFile)

    //then
    assertEquals("Expected one configuration", 1, configs.size())
    var configNoEnv = configs.singleWhere(\config -> StringUtils.isBlank(config.Env))
    assertEquals(ManagedS3OutboundConfiguration.Type, managedS3ConfigNoEnv, configNoEnv)
    assertEquals("Unexpected the config with different environment parameter to be parsed", 0, configs.countWhere(\config -> config.Env == differentEnv))

    //cleanup
    tempDir.delete()
  }

  private function assertEquals(expectedType : Type, expectedConfig : OutboundBaseConfig, actualConfig : OutboundConfigurationBase) {
    assertEquals("Expected config to be of type ${expectedType.toString()}", expectedType, typeof actualConfig)
    assertEquals("Expected parsed config name to be the same as in the XML config", expectedConfig.Name, actualConfig.Name)
    assertEquals("Expected parsed config file handler to be the same as in the XML config", expectedConfig.Handler, actualConfig.FileHandlerClass)
    assertEquals("Expected parsed config days till purge parameter to be the same as in the XML config", expectedConfig.DaysTillPurge, actualConfig.DaysTillPurge.intValue())
    assertEquals("Expected parsed config prefix parameter to be the same as in the XML config", expectedConfig.Prefix, actualConfig.Prefix)
    assertEquals("Expected parsed config extension parameter to be the same as in the XML config", expectedConfig.Extension, actualConfig.Extension)
    assertEquals("Expected parsed config prefix parameter to be the same as in the XML config", expectedConfig.Env, actualConfig.Env)
    if (actualConfig typeis OutboundLocalConfiguration) {
      var expectedLocalConfig = expectedConfig as OutboundLocalConfig
      var actualLocalConfig = actualConfig as OutboundLocalConfiguration
      assertEquals("Expected parsed config temporary directory parameter to be the same as in the XML config", expectedLocalConfig.TempDir, actualLocalConfig.TemporaryDirectory)
      assertEquals("Expected parsed config permanent directory parameter to be the same as in the XML config", expectedLocalConfig.PermDir, actualLocalConfig.PermanentDirectory)
    } else if (actualConfig typeis OutboundS3Configuration) {
      var expectedS3Config = expectedConfig as OutboundS3Config
      var actualS3Config = actualConfig as OutboundS3Configuration
      assertEquals("Expected parsed config temporary directory parameter to be the same as in the XML config", expectedS3Config.TempDir, actualS3Config.TemporaryDirectory)
      assertEquals("Expected parsed config bucket name parameter to be the same as in the XML config", expectedS3Config.BucketName, actualS3Config.PermanentBucketName)
      assertEquals("Expected parsed config prefix name parameter to be the same as in the XML config", expectedS3Config.PrefixName, actualS3Config.PermanentPrefix)
      assertEquals("Expected parsed config profile name parameter to be the same as in the XML config", expectedS3Config.ProfileName, actualS3Config.ProfileName)
    }
  }


  private function createSampleOutboundConfigXml(configs : List<OutboundBaseConfig>) : String {
    var configSb = new StringBuilder().append("<?xml version=\"1.0\"?>")
        .append("<OutboundConfigurations xmlns=\"http://guidewire.com/outbound/ext\">")
    configs.map(\config -> config.toXmlString()).each(\config -> configSb.append(config))
    configSb.append("</OutboundConfigurations>")
    return configSb.toString()
  }

  private function createTempDir() : File {
    var randomSuffix = RandomStringUtils.randomAlphabetic(5)
    return FileUtil.createTempDir("ManagedS3OutboundConfigTest-${randomSuffix}")
  }

  private function createSampleOutboundConfigFile(parentDir : File, name : String, content : String) : File {
    var configFile = new File(parentDir, name)
    var writer = new PrintWriter(configFile)
    try {
      writer.print(content)
    } finally {
      writer.close()
    }
    return configFile
  }

  private abstract static class OutboundBaseConfig {
    protected var _name : String as readonly Name
    protected var _handler : String as readonly Handler
    protected var _prefix : String as readonly Prefix
    protected var _extension : String as readonly Extension
    protected var _daysTillPurge : int as readonly DaysTillPurge
    protected var _env : String as readonly Env

    protected function withName(name : String) : OutboundBaseConfig {
      _name = name
      return this
    }

    protected function withHandler(handler : String) : OutboundBaseConfig {
      _handler = handler
      return this
    }

    protected function withPrefix(prefix : String) : OutboundBaseConfig {
      _prefix = prefix
      return this
    }

    protected function withExtension(extension : String) : OutboundBaseConfig {
      _extension = extension
      return this
    }

    protected function withDaysTillPurge(daysTillPurge : int) : OutboundBaseConfig {
      _daysTillPurge = daysTillPurge
      return this
    }

    protected function withEnv(env : String) : OutboundBaseConfig {
      _env = env
      return this
    }

    protected abstract function toXmlString() : String
  }

  private static class OutboundLocalConfig extends OutboundBaseConfig {
    private var _tempDir : String as TempDir
    private var _permDir : String as PermDir

    public function withTempDir(tempDir : String) : OutboundLocalConfig {
      _tempDir = tempDir
      return this
    }

    protected function withPermDir(permDir : String) : OutboundLocalConfig {
      _permDir = permDir
      return this
    }

    protected override function toXmlString() : String {
      // It appears that Gosu lexer doesn't like mixing expressions like if-else with String formatting, hence the gimnastics
      var sb = new StringBuilder()
      sb.append("<LocalConfiguration")
      var openingTag = (StringUtils.isNotBlank(_env) ? sb.append(" env=\"").append(_env).append("\">") : sb.append(">")).toString()
      return openingTag +
          "  <Name>${_name}</Name>" +
          "  <Prefix>${_prefix}</Prefix>" +
          "  <Extension>${_extension}</Extension>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "  <TemporaryDirectory>${_tempDir}</TemporaryDirectory>" +
          "  <PermanentDirectory>${_permDir}</PermanentDirectory>" +
          "</LocalConfiguration>"
    }
  }

  private static class OutboundS3Config extends OutboundBaseConfig {
    private var _tempDir : String as TempDir
    private var _bucketName : String as BucketName
    private var _prefixName : String as PrefixName
    private var _profileName : String as ProfileName

    function withTempDir(tempDir : String) : OutboundS3Config {
      _tempDir = tempDir
      return this
    }

    function withBucketName(bucketName : String) : OutboundS3Config {
      _bucketName = bucketName
      return this
    }

    function withPrefixName(prefixName : String) : OutboundS3Config {
      _prefixName = prefixName
      return this
    }

    function withProfileName(profileName : String) : OutboundS3Config {
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
          "  <Prefix>${_prefix}</Prefix>" +
          "  <Extension>${_extension}</Extension>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "  <TemporaryDirectory>${_tempDir}</TemporaryDirectory>" +
          "  <ProfileName>${_profileName}</ProfileName>" +
          "  <PermanentBucketName>${_bucketName}</PermanentBucketName>" +
          "  <PermanentPrefix>${_prefixName}</PermanentPrefix>" +
          "</S3Configuration>"
    }
  }

  private static class OutboundManagedS3Config extends OutboundBaseConfig {

    protected override function toXmlString() : String {
      // It appears that Gosu lexer doesn't like mixing expressions like if-else with String formatting, hence the gimnastics
      var sb = new StringBuilder()
      sb.append("<ManagedS3Configuration")
      var openingTag = (StringUtils.isNotBlank(_env) ? sb.append(" env=\"").append(_env).append("\">") : sb.append(">")).toString()
      return openingTag +
          "  <Name>${_name}</Name>" +
          "  <Prefix>${_prefix}</Prefix>" +
          "  <Extension>${_extension}</Extension>" +
          "  <FileHandlerClass>${_handler}</FileHandlerClass>" +
          "  <DaysTillPurge>${_daysTillPurge}</DaysTillPurge>" +
          "</ManagedS3Configuration>"
    }
  }
}