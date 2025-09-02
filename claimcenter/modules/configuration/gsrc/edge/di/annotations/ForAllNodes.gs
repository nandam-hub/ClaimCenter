package edge.di.annotations
uses java.lang.annotation.Target
uses java.lang.annotation.ElementType

/** 
 * Marker for "automatic type resolution". 
 */
@Target(ElementType.CONSTRUCTOR)
class ForAllNodes implements IAnnotation {
  
  private var _capability : String as readonly Capability

  construct() {

  }
  
  construct(cap : String) {
    this._capability = cap
  }

}
