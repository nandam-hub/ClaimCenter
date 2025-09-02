package edge.doc

final class ApidocMethodDescription implements IAnnotation {
  private var _methodDescription: String

  construct(methodDescription: String) {
    _methodDescription = methodDescription;
  }
}
