package edge.di.annotations
uses gw.lang.IAnnotation
uses java.lang.annotation.ElementType
uses java.lang.annotation.Target

/**
 * Private marker annotation. Should be used for gw-implemented injectable implementations.
 */
@Target(ElementType.CONSTRUCTOR)
class ForAllGwNodes implements IAnnotation {
  /** Optional capability bound. */
  private var _capability : String as readonly Capability
    
  construct() {

  }
  
  construct(cap : String) {
    this._capability = cap
  }

}
