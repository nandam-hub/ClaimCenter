package gw.plugin.outboundfile

uses gw.api.test.CCServerTestClassBase
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.ManagedS3OutboundConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundLocalConfiguration
uses gw.plugin.outboundfile.xsd.outbound_file_configuration_ext.types.complex.OutboundS3Configuration
uses gw.suites.ManagedS3OutboundConfigServerSuite
uses gw.testharness.v3.Suites

@Suites(ManagedS3OutboundConfigServerSuite.NAME)
class ManagedS3OutboundConfigContextServerTest extends CCServerTestClassBase {

  public function testCreateManagedConfigFromXml() {
    //given
    var integrationName = "managed-integration"
    var handler = "gw.SomeHandler"
    var daysTillPurge = 0
    var prefix = "pref"
    var extension = "xml"
    var s3BucketName = "some-bucket"
    var s3OutputPrefix = "some-prefix"
    var tempDir = "tmp"

    var managedS3OutboundConfigXml = new ManagedS3OutboundConfiguration()
    managedS3OutboundConfigXml.Name = integrationName
    managedS3OutboundConfigXml.FileHandlerClass = handler
    managedS3OutboundConfigXml.Prefix = prefix
    managedS3OutboundConfigXml.DaysTillPurge = daysTillPurge
    managedS3OutboundConfigXml.Extension = extension

    var contextUnderTest = new ManagedS3OutboundConfigContext(s3BucketName, s3OutputPrefix, tempDir)

    //when
    var outboundConfig = contextUnderTest.createConfigFromXml(managedS3OutboundConfigXml) as OutboundFileS3Config

    //then
    assertNotNull("Expected non-null reference", outboundConfig)
    assertEquals("Expected instance of OutboundS3FileConfig class", OutboundFileS3Config.Type, typeof outboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, outboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, outboundConfig.FileHandlerClass)
    assertEquals("Expected the Prefix param to be the same as in the XML config", prefix, outboundConfig.Prefix)
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, outboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the Extension param to be the same as in the XML config", extension, outboundConfig.Extension)
    assertEquals("Expected the TemporaryDirectory param to be the same as in the XML config", tempDir, outboundConfig.TemporaryDirectory)
    assertEquals("Expected the OutputBucketName param to be the same as the one passed to the context", s3BucketName,
        outboundConfig.DestinationS3Bucket)
    assertEquals("Expected the OutputS3Prefix param to be the <Output-prefix-passed-to-the-context>/<integration-name>",
        "${s3OutputPrefix}/${integrationName}", outboundConfig.DestinationS3Prefix)
    assertNull("Expected the ProfileName param to not be set", outboundConfig.ProfileName)
  }

  public function testCreateS3ConfigFromXml() {
    //given
    var integrationName = "s3-integration"
    var handler = "gw.SomeHandler"
    var daysTillPurge = 0
    var prefix = "pref"
    var extension = "xml"
    var s3BucketName = "some-bucket"
    var s3OutputPrefix = "some-prefix"
    var tempDir = "tmp"
    var s3ProfileName = "some-profile-name"

    var s3OutboundConfigXml = new OutboundS3Configuration()
    s3OutboundConfigXml.Name = integrationName
    s3OutboundConfigXml.FileHandlerClass = handler
    s3OutboundConfigXml.Prefix = prefix
    s3OutboundConfigXml.DaysTillPurge = daysTillPurge
    s3OutboundConfigXml.Extension = extension
    s3OutboundConfigXml.TemporaryDirectory = tempDir
    s3OutboundConfigXml.PermanentBucketName = s3BucketName
    s3OutboundConfigXml.PermanentPrefix = s3OutputPrefix
    s3OutboundConfigXml.ProfileName = s3ProfileName

    var contextUnderTest = new ManagedS3OutboundConfigContext(null, null, null)

    //when
    var outboundConfig = contextUnderTest.createConfigFromXml(s3OutboundConfigXml) as OutboundFileS3Config

    //then
    assertNotNull("Expected non-null reference", outboundConfig)
    assertEquals("Expected instance of OutboundS3FileConfig class", OutboundFileS3Config.Type, typeof outboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, outboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, outboundConfig.FileHandlerClass)
    assertEquals("Expected the Prefix param to be the same as in the XML config", prefix, outboundConfig.Prefix)
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, outboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the Extension param to be the same as in the XML config", extension, outboundConfig.Extension)
    assertEquals("Expected the TemporaryDirectory param to be the same as in the XML config", tempDir, outboundConfig.TemporaryDirectory)
    assertEquals("Expected the OutputBucketName param to be the same as in the XML config", s3BucketName,
        outboundConfig.DestinationS3Bucket)
    assertEquals("Expected the OutputS3Prefix param to be the same as in the XML config",
        s3OutputPrefix, outboundConfig.DestinationS3Prefix)
    assertEquals("Expected the ProfileName param to be the same as in the XML config", s3ProfileName, outboundConfig.ProfileName)
  }

  public function testCreateLocalConfigFromXml() {
    //given
    var integrationName = "s3-integration"
    var handler = "gw.SomeHandler"
    var daysTillPurge = 0
    var prefix = "pref"
    var extension = "xml"
    var tempDir = "tmp"
    var permDir = "perm-directory"

    var s3OutboundConfigXml = new OutboundLocalConfiguration()
    s3OutboundConfigXml.Name = integrationName
    s3OutboundConfigXml.FileHandlerClass = handler
    s3OutboundConfigXml.Prefix = prefix
    s3OutboundConfigXml.DaysTillPurge = daysTillPurge
    s3OutboundConfigXml.Extension = extension
    s3OutboundConfigXml.TemporaryDirectory = tempDir
    s3OutboundConfigXml.PermanentDirectory = permDir

    var contextUnderTest = new ManagedS3OutboundConfigContext(null, null, null)

    //when
    var outboundConfig = contextUnderTest.createConfigFromXml(s3OutboundConfigXml) as OutboundFileLocalConfig

    //then
    assertNotNull("Expected non-null reference", outboundConfig)
    assertEquals("Expected instance of OutboundS3FileConfig class", OutboundFileLocalConfig.Type, typeof outboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, outboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, outboundConfig.FileHandlerClass)
    assertEquals("Expected the Prefix param to be the same as in the XML config", prefix, outboundConfig.Prefix)
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, outboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the Extension param to be the same as in the XML config", extension, outboundConfig.Extension)
    assertEquals("Expected the TemporaryDirectory param to be the same as in the XML config", tempDir, outboundConfig.TemporaryDirectory)
    assertEquals("Expected the PermanentDirectory param to be the same as in the XML config", permDir, outboundConfig.PermanentDirectory)
  }
}