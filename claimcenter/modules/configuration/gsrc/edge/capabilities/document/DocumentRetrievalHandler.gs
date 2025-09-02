package edge.capabilities.document

uses edge.capabilities.document.exception.DocumentRetrievalException
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.authorization.exception.AuthorizationException
uses gw.document.DocumentContentsInfo

uses jakarta.servlet.ServletException
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses java.io.ByteArrayOutputStream
uses java.io.InputStream
uses java.io.OutputStream
uses java.lang.IllegalArgumentException

uses edge.PlatformSupport.Logger
uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.capabilities.document.IDocumentContentPlugin
uses edge.capabilities.document.util.DocumentUtil
uses edge.PlatformSupport.Bundle
uses java.lang.UnsupportedOperationException
uses java.util.regex.Pattern

/**
 * Implementation of Document Retrieval Handler.
 */
class DocumentRetrievalHandler implements IDocumentRetrievalHandler{

  private static final var TRANSFER_BUFFER_SIZE : int = 4096 //Size of the buffer used to send the document data back to the client
  private static final var LOGGER = new Logger(DocumentRetrievalHandler.Type.QName)

  private var _sessionPlugin : IDocumentSessionPlugin
  private var _contentPlugin : IDocumentContentPlugin

  @InjectableNode
  @Param("sessionPlugin", "Document session management plugin")
  @Param("contentPlugin", "Plugin to retrieve document contents from DMS")
  construct(sessionPlugin : IDocumentSessionPlugin, contentPlugin : IDocumentContentPlugin) {
    this._sessionPlugin = sessionPlugin
    this._contentPlugin = contentPlugin
  }

  /**
   * Validates the URL against a list of RegExes
   */
  private function validateRedirectURL (url: String = "") {
    var pattern = Pattern.compile(ScriptParameters.AllowedDocumentRetrievalRedirectUrls)
    if(pattern.matcher(url).find()) {
      return
    }
    throw new Exception("Cannot redirect. Invalid URL")
  }

  function doGet(req : HttpServletRequest, resp : HttpServletResponse) {
    try {

      LOGGER.logDebug("Processing document")
      var documentToken = req.getParameter("token")
      Bundle.transaction(\ b -> {
        var sessionDocID : String
        try {
          sessionDocID = _sessionPlugin.getSessionDocumentId(documentToken)
        } catch (ex : JsonRpcSecurityException) {
          throw new AuthorizationException(){:Message = "Unauthorized portal access"}
        }

        var docID = retrieveDocumentID(req)
        if(sessionDocID != docID) {
          throw new AuthorizationException(){:Message = "Unauthorized portal access"}
        }
        LOGGER.logDebug("Processing document id " + docID)
        var doc = DocumentUtil.getDocumentByPublicId(docID)
        var docContent = _contentPlugin.getDocumentContents(doc)

        try {
          switch(docContent.ResponseType) {
            case DocumentContentsInfo.ContentResponseType.DOCUMENT_CONTENTS:
              resp.setContentType(docContent.ResponseMimeType)
              resp.setHeader("Content-Disposition", "attachment; filename=" + DocumentUtil.getFileName(doc))
              copyStream(docContent.InputStream, resp.OutputStream)
              break;

            case DocumentContentsInfo.ContentResponseType.URL:
              var urlBuffer = new ByteArrayOutputStream()
              copyStream(docContent.InputStream, urlBuffer)
              resp.sendRedirect(urlBuffer.toString())
              break

            default:
              // Only DOCUMENT_CONTENTS or URL ResponseType is allowed for values returned
              // from IDocumentContentPlugin.getDocumentContentsInfoForExternalUse
              var msg = "Unexpected document content type: ${docContent.ResponseType}"
              LOGGER.logError("#doGet(HttpServletRequest,HttpServletResponse) - ${msg}")
              throw new ServletException(msg)
          }
       } finally {
         if ( docContent.InputStream != null ) {
           docContent.InputStream.close()
          }
       }
      }, _sessionPlugin.getSessionUser(documentToken))
    } catch(e:DocumentRetrievalException) {
      // Absolute error page URL will be '/pc/service/document/<error page>' (for PC 7)
      LOGGER.logError("Error retrieving document form the DocumentPlugin - ${e.Message}:${e.Code}", e)
      var redirect = req.getParameter("portalRoute")
      validateRedirectURL(redirect)
      resp.sendRedirect(redirect+".html"/*e.Code.ErrorUrl*/)
    } catch(e:JsonRpcInvalidRequestException) {
      resp.sendError(HttpServletResponse.SC_BAD_REQUEST)
    } catch(e:AuthorizationException) {
      LOGGER.logInfo(e.Message)
      resp.sendError(HttpServletResponse.SC_UNAUTHORIZED)
    }
  }

  /**
   * Retrieves the document ID for the current servlet request.
   * Throws JsonRpcInvalidParamsException
   */
  @Param("req", "Document request received")
  @Throws(JsonRpcInvalidRequestException,"If the request is not a valid document request")
  private function retrieveDocumentID(req:HttpServletRequest) : String {
    var params = req.PathInfo.split("/")

    var docId = params.HasElements ? params.last() : null
    if ( params.length < 2 || !docId.HasContent ) {
      throw new IllegalArgumentException("Invalid document request received: ${req.PathInfo}")
    }
    return docId
  }

    /**
   * Copies the input stream to the output stream using a temporary buffer
   */
  @Param("is", "The source stream")
  @Param("os", "The destination stream")
  private function copyStream(is:InputStream, os:OutputStream)     {
    var buffer = new byte[TRANSFER_BUFFER_SIZE]
    var cnt = 0
    do {
      cnt = is.read(buffer)
      if (cnt > 0) {
        os.write(buffer, 0, cnt)
      }
    } while( cnt > 0 )
    os.flush()
  }


}