package edge.PlatformSupport

uses gw.document.DocumentContentsInfo
uses gw.lang.reflect.IType
uses gw.plugin.document.IDocumentContentSource
uses gw.plugin.Plugins

class Document {

  public static function getDocumentContents(doc: Document): DocumentContentsInfo {
    return Plugins.get(IDocumentContentSource).getDocumentContentsInfo(doc, true)
  }

  public static function DocumentType(): IType {
    return DocumentContentsInfo
  }
}
