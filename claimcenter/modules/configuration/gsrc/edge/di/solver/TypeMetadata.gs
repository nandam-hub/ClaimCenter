package edge.di.solver
uses gw.lang.reflect.IConstructorHandler
uses gw.lang.reflect.IType
uses gw.util.Pair
uses edge.di.CapabilityAndPath

/**
 * Parsed information about the type.
 */
final class TypeMetadata {
  
  /** Type consttnnructor information. */
  var _ctor : IConstructorHandler as readonly Constructor
  
  /** Parameter information for this node. */
  var _parameters : CtorParamMetadata[] as readonly TypeParamMetadata
  
  /** Public "wildcard" rule. Set to null if type is not wildcard-injectable. */
  var _wildcardRules : List<Pair<String, RuleDefn>> as readonly WildcardRules
  
  /** Private "wildcard" rule. Set to null if type is not wildcard-injectable. */
  var _privateWildcardRules : List<Pair<String, RuleDefn>> as readonly PrivateWildcardRules
  
  /** Type rules applied to this type. */
  var _pathRules : List<Pair<CapabilityAndPath, RuleDefn>> as readonly PathRules
  
  /** Type information. */
  var _type : IType as ConcreteType
  
  internal construct(t : IType, c : IConstructorHandler, param : CtorParamMetadata[], 
      wr : List<Pair<String, RuleDefn>>, pwr : List<Pair<String, RuleDefn>>, pr : List<Pair<CapabilityAndPath, RuleDefn>>) {
    this._type = t
    this._ctor = c
    this._parameters = param
    this._wildcardRules = wr
    this._privateWildcardRules = pwr
    this._pathRules = pr
  }

}
