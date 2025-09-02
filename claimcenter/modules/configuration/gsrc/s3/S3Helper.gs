package s3

/**
 * S3 Util class which contains all utility methods
 * for s3 browser functionality and pcf support methods
 */
class S3Helper {

  public static function getKeyName(s3Object : software.amazon.awssdk.services.s3.model.S3Object, currentFolderName : String) : String {
    return s3Object.key() == currentFolderName ? ".." : s3Object.key()
  }

  public static function getTargetKeyName(s3Object : software.amazon.awssdk.services.s3.model.S3Object, currentFolderName : String) : String {
    return s3Object.key() == currentFolderName ? getParentFolderName(currentFolderName) : s3Object.key()
  }

  public static function getParentFolderName(currentFolderName : String) : String {
    if (currentFolderName != null) {
      if (currentFolderName.length() == 1) {
        return currentFolderName
      } else {
        var tempStr = currentFolderName.substring(0, currentFolderName.length() - 1)
        return tempStr?.substring(0, tempStr.lastIndexOf("/") + 1)
      }
    }
    return null
  }

}