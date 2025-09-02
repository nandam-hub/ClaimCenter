package gw.plugin.inboundfile

interface IManagedS3InboundConfig {
  function getS3BucketName() : String
  function getS3InputPrefix() : String
  function getS3ArchivePrefix() : String
}