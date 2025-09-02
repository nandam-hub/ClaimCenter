package edge.di.solver
uses gw.lang.reflect.IType

/** Metadata for constructor parameters. */
final class CtorParamMetadata {

  /** Declared parameter name. */
  var _name : String as readonly Name
  
  /** Parameter type. */
  var _type : IType as readonly ArgType
  
  /** Parameter documentation. May be null. */
  var _doc : String as readonly Documentation
  
  /** 
   * Parameter reference rules. 
   */
  var _refRule : List<RuleDefn> as readonly RefRule

  construct(n : String, t : IType, doc : String, ref : List<RuleDefn>) {
    this._name = n
    this._type = t
    this._refRule = ref
    this._doc = doc
  }

}
