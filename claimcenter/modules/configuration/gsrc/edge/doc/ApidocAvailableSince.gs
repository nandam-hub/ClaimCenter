package edge.doc

final class ApidocAvailableSince implements IAnnotation {
  private var _version: String

  construct(version: String) {
    _version = version;
  }
}
