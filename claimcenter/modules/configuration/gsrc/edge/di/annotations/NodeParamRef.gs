package edge.di.annotations
uses java.lang.annotation.Target
uses java.lang.annotation.ElementType

/** Annotation for referencing a subtree. */
@Target(ElementType.CONSTRUCTOR)
class NodeParamRef implements IAnnotation {
  
  var _name : String as Name
  var _reference : String as Reference

  construct(n : String, r : String) {
    this._name = n
    this._reference = r
  }

}
