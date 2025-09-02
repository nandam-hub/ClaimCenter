package gw.plugin.outboundfile

uses com.guidewire.pl.system.integration.plugins.PluginDefGosu
uses com.guidewire.testharness.v3.ServerTestFixture
uses gw.api.startable.IStartablePlugin
uses gw.api.test.CCServerTestClassBase
uses gw.lang.reflect.java.JavaTypes
uses gw.plugin.Plugins
uses gw.suites.ManagedS3OutboundConfigServerSuite
uses gw.testharness.v3.Suites

@SuppressWarnings("HiddenPackageReference")
@Suites(ManagedS3OutboundConfigServerSuite.NAME)
class ManagedS3OutboundConfigPluginServerTest extends CCServerTestClassBase {

  public function testPluginParameters() {
    //given
    var s3Bucket = 'some-bucket'
    var s3OutputPrefix = 'some-prefix'
    var pluginName = "PluginRegisteredInTest"
    var tempDir = "/tmp/"
    registerManagedS3OutboundConfigPlugin(pluginName, s3Bucket, s3OutputPrefix, tempDir)

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3OutboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3Bucket parameter value", s3Bucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3OutputPrefix parameter value", s3OutputPrefix, plugin.getS3OutputPrefix())
    assertEquals("Expected to return the tempDir parameter value", tempDir, plugin.getTemporaryDir())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  public function testPluginParametersWithEmptyTempDir() {
    //given
    var s3Bucket = 'some-bucket'
    var s3OutputPrefix = 'some-prefix'
    var pluginName = "PluginRegisteredInTest"
    registerManagedS3OutboundConfigPlugin(pluginName, s3Bucket, s3OutputPrefix, "")

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3OutboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3Bucket parameter value", s3Bucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3OutputPrefix parameter value", s3OutputPrefix, plugin.getS3OutputPrefix())
    assertEquals("Expected to return the tempDir parameter value", System.getProperty("java.io.tmpdir"), plugin.getTemporaryDir())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  public function testPluginParametersWithNotReplacedTmpValue() {
    //given
    var s3Bucket = 'some-bucket'
    var s3OutputPrefix = 'some-prefix'
    var pluginName = "PluginRegisteredInTest"
    registerManagedS3OutboundConfigPlugin(pluginName, s3Bucket, s3OutputPrefix, "\${PLUGIN_OUTBOUND_TEMP_DIR}")

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3OutboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3Bucket parameter value", s3Bucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3OutputPrefix parameter value", s3OutputPrefix, plugin.getS3OutputPrefix())
    assertEquals("Expected to return the tempDir parameter value", System.getProperty("java.io.tmpdir"), plugin.getTemporaryDir())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  public function testPluginParametersWithTrailingSlashes() {
    //given
    var s3Bucket = 'some-bucket'
    var s3OutputPrefix = 'some-prefix/'
    var s3OutputPrefixNoSlash = 'some-prefix'
    var pluginName = "PluginRegisteredInTest"
    var tempDir = "/tmp/"
    registerManagedS3OutboundConfigPlugin(pluginName, s3Bucket, s3OutputPrefix, tempDir)

    //when
    var plugin = Plugins.get(pluginName) as IManagedS3OutboundConfig

    //then
    assertNotNull("Expected plugin to be found", plugin)
    assertEquals("Expected to return the s3Bucket parameter value", s3Bucket, plugin.getS3BucketName())
    assertEquals("Expected to return the s3OutputPrefix parameter value", s3OutputPrefixNoSlash, plugin.getS3OutputPrefix())
    assertEquals("Expected to return the tempDir parameter value", tempDir, plugin.getTemporaryDir())

    //cleanup
    ServerTestFixture.restorePlugins()
  }

  private function registerManagedS3OutboundConfigPlugin(pluginName : String, s3Bucket : String, s3OutputPrefix : String, tempDir : String) {
    var paramMap = {"s3BucketName" -> s3Bucket, 's3OutputPrefix' -> s3OutputPrefix, 'temporaryDir' -> tempDir}
    var backingClassInfo = JavaTypes.getSystemType(IStartablePlugin).getBackingClassInfo()
    var pluginDefGosu = PluginDefGosu.newGosuPluginDef(backingClassInfo, ManagedS3OutboundConfigPlugin.Name, pluginName, paramMap, {IManagedS3OutboundConfig.Name})
    ServerTestFixture.registerPlugin(pluginName, pluginDefGosu)
  }
}