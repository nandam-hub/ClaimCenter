package edge.di.annotations
uses java.lang.annotation.Target
uses java.lang.annotation.ElementType

/** Node destination annotation. */
@Target(ElementType.CONSTRUCTOR)
class ForNode implements IAnnotation {
  /** Capability to inject node to. */ 
  var _capability : String as Capability
 
  /** Path to inject to. */
  var _path : String as Path
  

  construct(c : String, p : String) {
    this._capability = Capability
    this._path = p
  }

}
