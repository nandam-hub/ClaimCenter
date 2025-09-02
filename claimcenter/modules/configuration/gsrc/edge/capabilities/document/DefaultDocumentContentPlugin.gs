package edge.capabilities.document

uses gw.document.DocumentContentsInfo
uses gw.plugin.document.IDocumentContentSource
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.document.exception.DocumentRetrievalException
uses edge.capabilities.document.exception.DocumentErrorCode

class DefaultDocumentContentPlugin implements IDocumentContentPlugin {

  @ForAllGwNodes
  construct(){
  }

  override function getDocumentContents(doc : Document) : DocumentContentsInfo {
    var docContentPlugin = gw.plugin.Plugins.get(IDocumentContentSource)
    if (!docContentPlugin.OutboundAvailable) {
      throw new DocumentRetrievalException(DocumentErrorCode.CMS_TEMPORARLY_UNAVAILABLE, "The document is temporarily unavailable")
    }
    if (!docContentPlugin.isDocument(doc)) {
      throw new DocumentRetrievalException(DocumentErrorCode.DOCUMENT_NOT_IN_CMS,
          "The document with public ID ${doc.PublicID} has no associated content or it has been removed from the CMS.")
    }

    return docContentPlugin.getDocumentContentsInfo(doc, true)
  }

}
