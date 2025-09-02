package s3

uses gw.api.locale.DisplayKey
uses gw.api.util.LocationUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses software.amazon.awssdk.auth.credentials.AwsCredentialsProvider
uses software.amazon.awssdk.auth.credentials.AwsCredentialsProviderChain
uses software.amazon.awssdk.auth.credentials.InstanceProfileCredentialsProvider
uses software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider
uses software.amazon.awssdk.core.ResponseInputStream
uses software.amazon.awssdk.core.sync.RequestBody
uses software.amazon.awssdk.regions.Region
uses software.amazon.awssdk.services.s3.S3Client
uses software.amazon.awssdk.services.s3.model.CopyObjectRequest
uses software.amazon.awssdk.services.s3.model.GetObjectRequest
uses software.amazon.awssdk.services.s3.model.ListObjectsV2Request
uses software.amazon.awssdk.services.s3.model.PutObjectRequest
uses software.amazon.awssdk.services.s3.model.S3Object

uses java.nio.ByteBuffer

class AmazonS3Util {

  private var _s3Client : S3Client

  private static var _ins : AmazonS3Util

  private construct() {

    var credProvider = AwsCredentialsProviderChain.of( new AwsCredentialsProvider[]
        {InstanceProfileCredentialsProvider.create() as AwsCredentialsProvider, ProfileCredentialsProvider.create() as AwsCredentialsProvider})

    _s3Client = S3Client.builder().region(Region.of(PLUGIN_AWS_REGION)).credentialsProvider(credProvider).build()

  }

  /**
   * Singleton getter property
   * @return
   */
  public static property get Instance() : AmazonS3Util {
    if (_ins == null) {
      _ins = new AmazonS3Util()
    }

    return _ins
  }

  public static final var PLUGIN_AWS_REGION : String = System.getenv("PLUGIN_AWS_REGION")?.toString()

  public static final var PLUGIN_S3_BUCKET_NAME : String = System.getenv("PLUGIN_S3_BUCKET_NAME")?.toString()

  //inbound-pending/dev/cc/inbound-files/pending/

  public static final var PLUGIN_INBOUND_S3_INPUT_PREFIX : String = System.getenv("PLUGIN_INBOUND_S3_INPUT_PREFIX")?.toString()

  //inbound-pending/dev/cc/inbound-files/processed/

  public static final var PLUGIN_INBOUND_S3_ARCHIVE_PREFIX : String = System.getenv("PLUGIN_INBOUND_S3_ARCHIVE_PREFIX")?.toString()

  //inbound-pending/dev/cc/inbound-files/failed/

  public static final var PLUGIN_INBOUND_S3_FAILED_PREFIX : String = System.getenv("PLUGIN_INBOUND_S3_FAILED_PREFIX")?.toString()

  //dev/cc/outbound-files/

  public static final var PLUGIN_OUTBOUND_S3_OUTPUT_PREFIX : String = System.getenv("PLUGIN_OUTBOUND_S3_OUTPUT_PREFIX")?.toString()

  //dev/cc/archiving/

  public static final var PLUGIN_ARCHIVING_S3_PREFIX : String = System.getenv("PLUGIN_ARCHIVING_S3_PREFIX")?.toString()


  private static final var _logger = StructuredLogger.INTEGRATION_FILE

  /**

   * Places a single file with provided contents under provided path

   *

   * @param folderName   Relative folder path

   * @param fileName     File name with extension

   * @param fileContents String contents to be written into the file

   */

  public function uploadtoS3(folderName : String, fileName : String, fileContents : ByteBuffer) {

    var keyPath =  folderName + fileName

    try {

      if (_logger.DebugEnabled) {

        _logger.debug("Writing key '${keyPath}' into Guidewire's S3 Bucket..")

      }

      var por = PutObjectRequest.builder().bucket(PLUGIN_S3_BUCKET_NAME).key(keyPath).build() as PutObjectRequest

      var response = this._s3Client.putObject(por, (RequestBody.fromByteBuffer(fileContents) as RequestBody))

      if (_logger.DebugEnabled) {

        _logger.debug("Key writing response: ${response}")

      }
      LocationUtil.addRequestScopedInfoMessage(DisplayKey.get("Config.S3Browser.Upload.SuccessfulMessage", fileName, keyPath))

    } catch (ex : Exception) {

      _logger.error("Error writing to path '${keyPath}'. Exception is: ${ex.Message}", #uploadtoS3(), ex)
      LocationUtil.addRequestScopedErrorMessage(DisplayKey.get("Config.S3Browser.Upload.FailureMessage", fileName, ex))
    }

  }

  /**

   * This method will place the file in S3 location specified

   *

   * @param folderName

   * @param fileName

   * @param content

   */

  public function uploadToS3Bucket(folderName : String, fileName : String, content : String) {

    //Example - folder name - samplefolder  and file name - samplefile.txt

    var objectKey = PLUGIN_OUTBOUND_S3_OUTPUT_PREFIX + folderName + "/" + fileName

    try {

      var putRequest = PutObjectRequest

          .builder()

          .bucket(PLUGIN_S3_BUCKET_NAME)

          .key(objectKey)

          .build() as PutObjectRequest

      var output = _s3Client.putObject(putRequest, (RequestBody.fromString(content) as RequestBody))

      _logger.info("File uploaded successfully. ETag: ${output.eTag()} , File Name - ${fileName}", :method = #uploadToS3Bucket(String, String, String),

          :methodClazz = "AmazonS3Util", :methodName = "uploadToS3Bucket")

    } catch (e : Exception) {

      _logger.error("Failed to upload File - ${fileName}" + e.StackTraceAsString, :ex = e, :method = #uploadToS3Bucket(String, String, String),

          :methodClazz = "AmazonS3Util", :methodName = "uploadToS3Bucket")

    }

  }

  /***
   * it takes folder name as parameter and read files from amazon s3 bucket
   * @param folderName
   * @return
   */

  public function readFilesFromS3Bucket(folderName : String) : List<S3Object> {

    var inboundFolder = folderName

    var s3Objectlist : List<S3Object>

    try {

      var listRq = ListObjectsV2Request

          .builder()

          .bucket(PLUGIN_S3_BUCKET_NAME)

          .prefix(inboundFolder)

          .build() as ListObjectsV2Request

      var res = _s3Client.listObjectsV2(listRq)

      s3Objectlist = res.contents()

      _logger.info("Files fetched successfully. ETag: ${res.sdkHttpResponse()} , Folder Name - ${inboundFolder}", :method = #readFilesFromS3Bucket(String),

          :methodClazz = "AmazonS3Util", :methodName = "readFilesFromS3Bucket")

    } catch (e : Exception) {

      _logger.error("Failed to upload File to folder - ${inboundFolder}" + e.StackTraceAsString, :ex = e, :method = #readFilesFromS3Bucket(String),

          :methodClazz = "AmazonS3Util", :methodName = "readFilesFromS3Bucket")

    }

    return s3Objectlist

  }

  public function isValidFolderName(folderName : String) : boolean {
    return (GosuStringUtil.isNotBlank(folderName) && folderName.endsWith("/"))
  }

  /***
   * this method takes two parameters current folder and new folder names and creates the new folder in S3 bucket
   * @param CurrentFolderName
   * @param newFolderName
   */
  public function createNewFolder(currentFolderName : String, newFolderName : String) : boolean {

    if (! isValidFolderName(currentFolderName)) {
      throw new Exception("Invalid current folder Name: " + currentFolderName)
    }

    if (GosuStringUtil.isBlank(newFolderName)) {
      throw new Exception("Invalid new folder name: " + newFolderName)
    }

    var keyPath = currentFolderName + newFolderName

    if (!keyPath.endsWith( "/")) {
      keyPath += "/";
    }

    try {

      if (_logger.DebugEnabled) {

        _logger.debug("Writing key '${keyPath}' into Guidewire's S3 Bucket..")

      }

      var por = PutObjectRequest.builder().bucket(PLUGIN_S3_BUCKET_NAME).key(keyPath).build() as PutObjectRequest

      var response = this._s3Client.putObject(por, (RequestBody.empty() as RequestBody))

      if (_logger.DebugEnabled) {

        _logger.debug("Key writing response: ${response}")
      }
      LocationUtil.addRequestScopedInfoMessage(DisplayKey.get("Config.S3Browser.CreateFolder.SuccessfulMessage", newFolderName))

    } catch (ex : Exception) {
      _logger.error("Error writing to path '${keyPath}'. Exception is: ${ex.Message}", #uploadtoS3(), ex)
      LocationUtil.addRequestScopedErrorMessage(DisplayKey.get("Config.S3Browser.CreateFolder.FailureMessage", newFolderName, ex))
      return false
    }

    return true

  }

  /***
   * this method takes the file path and returns input stream
   * @param filePath
   * @return
   */
  public  function returnFileAsStream(filePath: String): ResponseInputStream {
    try {
      var getObj = GetObjectRequest.builder().bucket(PLUGIN_S3_BUCKET_NAME).key(filePath).build() as GetObjectRequest
      return _s3Client.getObject(getObj)
    }catch(except: Exception){
      _logger.error("exception during file upload  " , :ex = except, :method = #returnFileAsStream(String),
          :methodClazz = "AmazonS3Util", :methodName = "returnS3FileStream")
    }
    return null
  }

  /***
   * this method takes the file path and download that file in local environment
   * @param filePath
   */
  public  function downloadSelectedFile(filePath: String ){
    var fileName = filePath.split("/").last()
    try {
      var getObj = GetObjectRequest.builder().bucket(PLUGIN_S3_BUCKET_NAME).key(filePath).build() as GetObjectRequest
      var response = _s3Client.getObject(getObj).response()
      var contentType = response.contentType()
      var contentSize = response.contentLength().intValue()
      var responseInputStream: ResponseInputStream = returnFileAsStream(filePath)
      com.guidewire.pl.web.util.WebFileUtil.copyStreamToClient(contentType, fileName, responseInputStream, contentSize);
      LocationUtil.addRequestScopedInfoMessage(DisplayKey.get("Config.S3Browser.Download.SuccessfulMessage", fileName))
    } catch (ex: Exception) {
      _logger.error("exception occured during file download  " , :ex = ex, :method = #downloadSelectedFile(String),
          :methodClazz = "AmazonS3Util", :methodName = "downloadSelectedFile")
      LocationUtil.addRequestScopedErrorMessage(DisplayKey.get("Config.S3Browser.Download.FailureMessage", fileName, ex))
    }
  }

  public  function copyFile(sourcePath : String, destinationPath : String){
    var fileName = sourcePath.split("/").last()
    try {
      var copyObjReq = CopyObjectRequest.builder().sourceBucket(PLUGIN_S3_BUCKET_NAME).sourceKey(sourcePath).
          destinationBucket(PLUGIN_S3_BUCKET_NAME).destinationKey(destinationPath).build() as CopyObjectRequest
      _logger.info(" s3client details " + copyObjReq.toString())
      this._s3Client.copyObject(copyObjReq)
      _logger.info(".File uploaded successfully ETag: File Name - ${fileName}")
      LocationUtil.addRequestScopedInfoMessage(DisplayKey.get("Config.S3Browser.CopyFile.SuccessfulMessage", fileName))
    } catch (ex: Exception) {
      _logger.error("exception occured during file download  " , :ex = ex, :method = #copyFile(String, String),
          :methodClazz = "AmazonS3Util", :methodName = "copyFile")
      LocationUtil.addRequestScopedErrorMessage(DisplayKey.get("Config.S3Browser.CopyFile.FailureMessage", fileName, ex))
    }
  }

}
