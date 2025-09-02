package gw.plugin.inboundfile

uses gw.api.test.CCServerTestClassBase
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundLocalConfiguration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.InboundS3Configuration
uses gw.plugin.inboundfile.xsd.inbound_file_configuration_ext.types.complex.ManagedS3InboundConfiguration
uses gw.suites.ManagedS3InboundConfigServerSuite
uses gw.testharness.v3.Suites

@Suites(ManagedS3InboundConfigServerSuite.NAME)
class ManagedS3InboundConfigContextServerTest extends CCServerTestClassBase {

  var integrationName = "some-integration"
  var handler = "gw.SomeHandler"
  var chunkSize = 0
  var daysTillPurge = 0

  public function testCreateManagedConfigFromXml() {
    //given
    var s3BucketName = "some-bucket"
    var s3InputPrefix = "some-prefix"
    var s3ArchivePrefix = "some-archive-prefix"

    var managedS3InboundConfigXml = new ManagedS3InboundConfiguration()
    managedS3InboundConfigXml.setName(integrationName)
    managedS3InboundConfigXml.setFileHandlerClass(handler)
    managedS3InboundConfigXml.setChunkSize(chunkSize)
    managedS3InboundConfigXml.setDaysTillPurge(daysTillPurge)

    var contextUnderTest = new ManagedS3InboundConfigContext(s3BucketName, s3InputPrefix, s3ArchivePrefix)

    //when
    var inboundConfig = contextUnderTest.createConfigFromXml(managedS3InboundConfigXml) as InboundS3FileConfig

    //then
    assertNotNull("Expected non-null reference", inboundConfig)
    assertEquals("Expected instance of InboundS3FileConfig class", InboundS3FileConfig.Type, typeof inboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, inboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, inboundConfig.FileHandlerClass)
    assertEquals("Expected the ChunkSize param to be the same as in the XML config", chunkSize, inboundConfig.ChunkSize.intValue())
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, inboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the InputBucketName param to be the same as the one passed to the context", s3BucketName,
        inboundConfig.InputS3Bucket)
    assertEquals("Expected the ArchiveBucketName param to be the same as the InputBucketName passed to the context",
        s3BucketName, inboundConfig.ArchiveS3Bucket)
    assertEquals("Expected the InputS3Prefix param to be the <input-prefix-passed-to-the-context>/<integration-name>",
        "${s3InputPrefix}/${integrationName}", inboundConfig.InputS3Prefix)
    assertEquals("Expected the ArchiveS3Prefix param to be the <archive-prefix-passed-to-the-context>/<integration-name>",
        "${s3ArchivePrefix}/${integrationName}", inboundConfig.ArchiveS3Prefix)
  }

  public function testCreateS3ConfigFromXml() {
    //given
    var s3InputBucketName = "bucket"
    var s3ArchiveBucketName = "bucket-arch"
    var s3Profile = "profile"
    var s3InputPrefix = "some-prefix"
    var s3ArchivePrefix = "some-archive-prefix"

    var s3InboundConfigXml = new InboundS3Configuration()
    s3InboundConfigXml.setName(integrationName)
    s3InboundConfigXml.setFileHandlerClass(handler)
    s3InboundConfigXml.setChunkSize(chunkSize)
    s3InboundConfigXml.setDaysTillPurge(daysTillPurge)
    s3InboundConfigXml.setInputBucketName(s3InputBucketName)
    s3InboundConfigXml.setInputPrefix(s3InputPrefix)
    s3InboundConfigXml.setArchiveBucketName(s3ArchiveBucketName)
    s3InboundConfigXml.setArchivePrefix(s3ArchivePrefix)
    s3InboundConfigXml.setProfileName(s3Profile)

    var contextUnderTest = new ManagedS3InboundConfigContext("s3BucketName", "s3InputPrefix", "s3ArchivePrefix")

    //when
    var inboundConfig = contextUnderTest.createConfigFromXml(s3InboundConfigXml) as InboundS3FileConfig

    //then
    assertNotNull("Expected non-null reference", inboundConfig)
    assertEquals("Expected instance of InboundS3FileConfig class", InboundS3FileConfig.Type, typeof inboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, inboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, inboundConfig.FileHandlerClass)
    assertEquals("Expected the ChunkSize param to be the same as in the XML config", chunkSize, inboundConfig.ChunkSize.intValue())
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, inboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the InputBucketName param to be the same as in the XML config", s3InputBucketName, inboundConfig.InputS3Bucket)
    assertEquals("Expected the ArchiveBucketName param to be the same as in the XML config", s3ArchiveBucketName, inboundConfig.ArchiveS3Bucket)
    assertEquals("Expected the InputS3Prefix param to be the same as in the XML config", s3InputPrefix, inboundConfig.InputS3Prefix)
    assertEquals("Expected the ArchiveS3Prefix param to be the same as in the XML config", s3ArchivePrefix, inboundConfig.ArchiveS3Prefix)
    assertEquals("Expected the ProfileName param to be the same as in the XML config", s3Profile, inboundConfig.ProfileName)
  }

  public function testCreateLocalConfigFromXml() {
    //given
    var inputDir = "inputDir"
    var archiveDir = "archiveDir"

    var localInboundConfigXml = new InboundLocalConfiguration()
    localInboundConfigXml.setName(integrationName)
    localInboundConfigXml.setFileHandlerClass(handler)
    localInboundConfigXml.setChunkSize(chunkSize)
    localInboundConfigXml.setDaysTillPurge(daysTillPurge)
    localInboundConfigXml.setInputDirectory(inputDir)
    localInboundConfigXml.setArchiveDirectory(archiveDir)

    var contextUnderTest = new ManagedS3InboundConfigContext("s3BucketName", "s3InputPrefix", "s3ArchivePrefix")

    //when
    var inboundConfig = contextUnderTest.createConfigFromXml(localInboundConfigXml) as InboundLocalFileConfig

    //then
    assertNotNull("Expected non-null reference", inboundConfig)
    assertEquals("Expected instance of InboundS3FileConfig class", InboundLocalFileConfig.Type, typeof inboundConfig)
    assertEquals("Expected the Name param to be the same as in the XML config", integrationName, inboundConfig.Name)
    assertEquals("Expected the FileHandlerClass param to be the same as in the XML config", handler, inboundConfig.FileHandlerClass)
    assertEquals("Expected the ChunkSize param to be the same as in the XML config", chunkSize, inboundConfig.ChunkSize.intValue())
    assertEquals("Expected the DaysTillPurge param to be the same as in the XML config", daysTillPurge, inboundConfig.DaysTillPurge.intValue())
    assertEquals("Expected the InputDirectory param to be the same as in the XML config", inputDir, inboundConfig.InputDirectory)
    assertEquals("Expected the ArchiveDirectory param be the same as in the XML config", archiveDir, inboundConfig.ArchiveDirectory)
  }
}