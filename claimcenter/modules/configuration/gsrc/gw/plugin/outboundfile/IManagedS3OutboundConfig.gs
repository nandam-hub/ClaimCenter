package gw.plugin.outboundfile

interface IManagedS3OutboundConfig {
  function getS3BucketName() : String
  function getS3OutputPrefix() : String
  function getTemporaryDir() : String
}