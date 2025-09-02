package edge.doc

final class DocMethodDescription implements IAnnotation{
  private var _methodDescription : String
  construct(methodDescription : String) {
    _methodDescription = methodDescription;
  }
}
