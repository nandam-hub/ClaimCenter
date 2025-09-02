package edge.masking.annotation

class Masked implements IAnnotation {

  private var pattern = "********"

  construct() {}

  construct(p: String) {
    this.pattern = p
  }

  public function pattern(): String {
    return this.pattern
  }
}
