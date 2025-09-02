package edge.capabilities.document.util

uses edge.capabilities.document.dto.DocumentBaseDTO
uses edge.capabilities.document.dto.DocumentUploadDTO
uses edge.capabilities.document.exception.DocumentErrorCode
uses edge.capabilities.document.exception.DocumentRetrievalException
uses gw.api.database.Query
uses gw.api.util.DateUtil
uses gw.document.DocumentsUtilBase
uses java.lang.UnsupportedOperationException

final class DocumentUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  /**
   * Fills almost all  base-dto properties on the document.
   * Following fields are excluded:
   * <ul>
   *  <li>SessionId
   * </ul>
   */
  public static function fillDocumentBase(res : DocumentBaseDTO, d : Document) {
    res.PublicID = d.PublicID
    res.DocUID = d.DocUID
    res.Name = getFileName(d)
    res.Description = d.Description
    res.DocumentType = d.Type
    res.MimeType = d.MimeType
    res.Recipient = d.Recipient
    res.SecurityType = d.SecurityType
    res.Status = d.Status
    res.Author = d.Author
    res.DateModified = d.DateModified
  }

  /**
   * Method to return the file name with extension
   * @param document
   * @return fullFileName
   */
  public static function getFileName(d : Document) : String{

    var fileBaseName = d.Name
    var fullFileName = fileBaseName
    var fileExtension = DocumentsUtilBase.getFileExtensionForMimeType(d.MimeType);
    if(fileExtension.NotBlank && !fileBaseName.endsWith(fileExtension)) {
      fullFileName = fileBaseName + fileExtension;
    }
    return fullFileName
  }

  /**
   * Updates properties on the document from the base dto.
   * See also a helper method which set additional defaults.
   */
  public static function fillDocumentBase(d : Document, res : DocumentUploadDTO) {
    d.Name = res.Name
    d.Description = res.Description
    d.MimeType = res.MimeType
    d.DocumentIdentifier = res.Name.length() > 60 ? res.Name.substring(0,60) : res.Name
  }

  /**
   * Fills document with properties with upload and sets some usefull defaults.
   */
  public static function fillDocumentWithDefaults(d : Document, upload : DocumentUploadDTO) {
    fillDocumentBase(d, upload)
    d.SecurityType = typekey.DocumentSecurityType.TC_UNRESTRICTED
    d.Status = typekey.DocumentStatusType.TC_APPROVED
    d.DateModified = DateUtil.currentDate()
    d.DMS = true
    d.Inbound = true
    d.Obsolete = false
  }


  /**
   * Fetches a document given public document id.
   */
  @Throws(DocumentRetrievalException, "If document was not found")
  public static function getDocumentByPublicId(publicID : String) : Document {
    var doc = Query.make(Document).compare("PublicID",Equals, publicID).select().AtMostOneRow
    if ( doc == null ) {
      throw new DocumentRetrievalException(DocumentErrorCode.DOCUMENT_NOT_FOUND, "Document not found: PublicID=${publicID}")
    }
    return doc
  }
}
