package gw.plugin.inboundfile

uses com.guidewire.pl.system.integration.plugins.PluginDefGosu
uses com.guidewire.testharness.v3.ServerTestFixture
uses gw.api.startable.IStartablePlugin
uses gw.api.test.CCServerTestClassBase
uses gw.lang.reflect.java.JavaTypes
uses gw.plugin.Plugins
uses gw.suites.ManagedS3InboundConfigServerSuite
uses gw.testharness.v3.Suites

@SuppressWarnings("HiddenPackageReference")
@Suites(ManagedS3InboundConfigServerSuite.NAME)
class ManagedS3InboundConfigPluginServerTest extends CCServerTestClassBase {

  public function testPluginParameters() {
    //given
    var s3InputBucket = 'some-bucket'
    var s3InputPrefix = 'some-prefix'
    var s3ArchivePrefix = 'some-prefix/archive'
    var pluginName = "PluginRegisteredInTest"
    registerManagedS3InboundConfigPlugin(pluginName, s3InputBucket, s3InputPrefix, s3ArchivePrefix)

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3InboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3InputBucket parameter value", s3InputBucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3InputPrefixt parameter value", s3InputPrefix, plugin.getS3InputPrefix())
    assertEquals("Expected to return the s3ArchivePrefix parameter value", s3ArchivePrefix, plugin.getS3ArchivePrefix())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  public function testPluginParametersWithTralingSlashes() {
    //given
    var s3InputBucket = 'some-bucket'
    var s3InputPrefix = 'some-prefix/'
    var s3InputPrefixNoSlash = 'some-prefix'
    var s3ArchivePrefix = 'some-prefix/archive/'
    var s3ArchivePrefixNoSlash = 'some-prefix/archive'
    var pluginName = "PluginRegisteredInTest"
    registerManagedS3InboundConfigPlugin(pluginName, s3InputBucket, s3InputPrefix, s3ArchivePrefix)

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3InboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3InputBucket parameter value", s3InputBucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3InputPrefixt parameter value", s3InputPrefixNoSlash, plugin.getS3InputPrefix())
    assertEquals("Expected to return the s3ArchivePrefix parameter value", s3ArchivePrefixNoSlash, plugin.getS3ArchivePrefix())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  private function registerManagedS3InboundConfigPlugin(pluginName : String, s3InputBucket : String, s3InputPrefix : String, s3ArchivePrefix : String) {
    var paramMap = { "s3BucketName" -> s3InputBucket, 's3InputPrefix' -> s3InputPrefix, 's3ArchivePrefix' -> s3ArchivePrefix }
    var backingClassInfo = JavaTypes.getSystemType(IStartablePlugin).getBackingClassInfo();
    var pluginDefGosu = PluginDefGosu.newGosuPluginDef(backingClassInfo, ManagedS3InboundConfigPlugin.Name, pluginName, paramMap, { IManagedS3InboundConfig.Name });
    ServerTestFixture.registerPlugin(pluginName, pluginDefGosu)
  }
}