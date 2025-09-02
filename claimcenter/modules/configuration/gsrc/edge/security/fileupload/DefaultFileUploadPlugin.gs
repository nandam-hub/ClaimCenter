package edge.security.fileupload

uses edge.di.annotations.ForAllGwNodes
uses org.apache.commons.fileupload2.core.FileItem
uses org.apache.tika.config.TikaConfig
uses org.apache.tika.io.TikaInputStream
uses org.apache.tika.metadata.Metadata

class DefaultFileUploadPlugin implements IFileUploadPlugin {

  /**
   * List of allowed content types. If empty the DISALLOWED_CONTENT_TYPES is used
   */
  private static final var ALLOWED_CONTENT_TYPES : String[] = {
      "image/png",
      "image/bmp",
      "image/jpeg",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/mp2t",
      "audio/wav",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }

  /**
   * List of disallowed content types for file uploads. Used only if ALLOWED_CONTENT_TYPES is empty
   */
  private static final var DISALLOWED_CONTENT_TYPES : String[] = {
      ".*html",
      ".*javascript",
      ".*x-msdownload",
      ".*octet-stream"
  }

  @ForAllGwNodes
  construct() {}

  override function canUploadContentType(contentType : String) : boolean {
    if (ALLOWED_CONTENT_TYPES.IsEmpty) {
      return !DISALLOWED_CONTENT_TYPES.hasMatch(\pattern -> contentType.matches(pattern))
    } else {
      return ALLOWED_CONTENT_TYPES.hasMatch(\pattern -> contentType.matches(pattern))
    }
  }

  override function canUploadContentType(documentFile : FileItem) : boolean {

    if (documentFile == null) {
      return false
    }

    var contentTypeDetected = detectContentType(documentFile)
    var fileExtensionDetected = detectFileExtension(documentFile)

    if (ALLOWED_CONTENT_TYPES.IsEmpty) {
      return !DISALLOWED_CONTENT_TYPES.hasMatch(\pattern -> contentTypeDetected.matches(pattern))
    } else {
      return ALLOWED_CONTENT_TYPES.hasMatch(\pattern -> contentTypeDetected.matches(pattern) && fileExtensionDetected.matches(pattern))
    }
  }

  private function detectContentType(documentFile : FileItem) : String {

    var detector = TikaConfig.getDefaultConfig().getDetector()
    var stream = TikaInputStream.get(documentFile.InputStream)
    var metadata = new Metadata()
    metadata.add(Metadata.RESOURCE_NAME_KEY, documentFile.getName())

    var mediaTypeContentDetected = detector.detect(stream, metadata)

    return mediaTypeContentDetected.toString()
  }

  private function detectFileExtension(documentFile : FileItem) : String {

    var detector = TikaConfig.getDefaultConfig().getDetector()
    var metadata = new Metadata()
    metadata.add(Metadata.RESOURCE_NAME_KEY, documentFile.getName())

    var mediaTypeFileExtention = detector.detect(null, metadata)

    return mediaTypeFileExtention.toString()
  }
}