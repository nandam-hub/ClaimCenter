package edge.di.solver
uses gw.lang.reflect.Modifier
uses gw.lang.reflect.IConstructorInfo
uses gw.lang.reflect.IType
uses edge.di.annotations.ForAllGwNodes
uses gw.lang.reflect.IParameterInfo
uses edge.di.annotations.NodeParamRef
uses edge.di.Path
uses java.util.Collections
uses edge.di.annotations.ForNode
uses edge.di.annotations.ForAllNodes
uses edge.util.memo.Memo1
uses edge.di.solver.goals.PathGoal
uses gw.util.Pair
uses edge.di.solver.goals.Goal
uses edge.di.CapabilityAndPath
uses gw.api.util.Logger
uses edge.di.annotations.InjectableNode
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.GosuDoc

/**
 * Analyzer for type information. Introspect types and provides information about 
 * instance constructor and applicable rules.
 */
internal final class TypeAnalyzer {

  private static var LOGGER = Logger.forCategory(TypeAnalyzer.Type.QName)

  /** Guidewire types for the additional checks. */
  private static var GW_TYPES : IType[] = {ForAllGwNodes, ForAllNodes, ForNode, InjectableNode}

  /** Cached type information. */
  private var _resolutionCache = Memo1.makeMemo<IType, TypeMetadata>(\ t -> extractMetadata(t))

  construct() {
  }

  /**
   * Returns information about the type. Returns null if type has some errors 
   * (has no constructor, etc...).
   */
  function getMetadata(t : IType) : TypeMetadata {
    return _resolutionCache.apply(t)
  }


  /** Extracts information about the type. 
   * Returns <code>null</code> iff type is not a legally injectible type.
   */
  private function extractMetadata(t : IType) : TypeMetadata {
    if (t.Primitive) {
      return null
    }

    if (!isAccessible(t)) {
      if (t.TypeInfo.Constructors.hasMatch(\ ctor -> ctorHasDIAnnotations(ctor))) {
        LOGGER.warn(t.QName + ": Type is not accessible but has DI annotations on it")
      }
      return null
    }

    final var injectableCtor = findUniqueInjectableCtor(t)
    if (injectableCtor == null) {
      return null
    }

    final var ownGoal = Goal.forType(t)

    final var refs = Reflection.getAnnotationValues(injectableCtor, NodeParamRef).map(\ c -> c as NodeParamRef)
    final var docs = Reflection.getAnnotationValues(injectableCtor, Param).map(\c -> c as Param)
    final var pathRules = Reflection.getAnnotationValues(injectableCtor, ForNode).map(\ c -> {
      final var cc = c as ForNode
      return Pair.make(
        new CapabilityAndPath(cc.Capability, Path.parse(cc.Path)),
        new RuleDefn("ForNode Annotation on " + t.Namespace + "." + t.Name, ownGoal))
    })

    /* Unused Annotations. */
    final var allParamNames = injectableCtor.Parameters.map(\ p -> p.Name).toSet()

    for (var ref in refs) {
      if (!allParamNames.contains(ref.Name)) {
        LOGGER.warn(t.QName + ": Reference specification for unused parameter " + ref.Name)
      }
    }

    for (var doc in docs) {
      if (!allParamNames.contains(GosuDoc.getParamName(doc))) {
        LOGGER.warn(t.QName + ": Param specification for unused parameter " + GosuDoc.getParamName(doc))
      }
    }


    final var paramMeta = injectableCtor.Parameters.map(\ p -> analyzeParameter(p, refs, docs, t))
    final var injectAttr = Reflection.getAnnotationValues(injectableCtor, ForAllNodes).map(\c -> {
      final var cc = c as ForAllNodes
      return Pair.make(cc.Capability, new RuleDefn("Wildcard Annotation on " +  t.QName, ownGoal))
    })
    final var privateInjectAttr = Reflection.getAnnotationValues(injectableCtor, ForAllGwNodes).map(\c -> {
      final var cc = c as ForAllGwNodes
      return Pair.make(cc.Capability, new RuleDefn("GW Wildcard Annotation on " + t.QName, ownGoal))
    })

    return new TypeMetadata(t, injectableCtor.Constructor, paramMeta, injectAttr, privateInjectAttr, pathRules)
  }



  /** Analyzes one parameter to injectable ctor. */
  private function analyzeParameter(param : IParameterInfo, refs : List<NodeParamRef>, docs : List<Param>, parent : IType) : CtorParamMetadata {
    if (refs == null) {
      refs = Collections.emptyList<NodeParamRef>()
    }
    if  (docs == null) {
      docs = Collections.emptyList<Param>()
    }

    final var doc = docs.where(\ n -> GosuDoc.getParamName(n) == param.Name)

    var docString : String = null

    if (doc.length > 1) {
      LOGGER.warn(parent.Namespace + "." + parent.Name + ": Constructor parameter " + param.Name + " has more than one documentation annotation")
    } else if(doc.length == 1) {
      docString = GosuDoc.getParamDescription(doc.get(0))
    }

    final var rules = refs.where(\ n -> n.Name == param.Name)

    return new CtorParamMetadata(param.Name, param.Type, docString,
      rules.map(\ rr ->new RuleDefn("Ref annotation for parameter " + rr.Name + " on type " + parent.QName,
        Goal.forPath(Path.parse(rr.Reference)))))
  }



  /** Validates constructors for the type and emits warnings.
   * Returns an unique injectable constructor for type. Otherwise 
   * (no injectable ctors, more than one available ctor) returns <code>null</code>.
   */
  private function findUniqueInjectableCtor(t : IType) : IConstructorInfo {
    final var annotatedCtors = t.TypeInfo.Constructors.where(\ ctor -> ctorHasDIAnnotations(ctor))

    /* Not eligible for automatic construction. */
    if (annotatedCtors.length == 0) {
      return null
    }

    for (var ctor in annotatedCtors) {
      if (!ctor.Public) {
        LOGGER.warn(t.Namespace + "." + t.Name + ": Type has a DI-annotated inaccessible ctor " + ctor)
      }
    }

    final var accessibleCtors = annotatedCtors.where(\ ctor -> ctor.Public)

    if (accessibleCtors.length != 1) {
      LOGGER.error(t.Namespace + "." + t.Name + ": Type has no unique accessible DI-annotated constructor")
      return null
    }

    return accessibleCtors[0]
  }



  /** Checks if type is accessible. */
  private function isAccessible(t : IType) : Boolean {
    final var mods = t.Modifiers

    if ((mods &  Modifier.PUBLIC) == 0) {
      return false
    }

    if ((mods & Modifier.ABSTRACT) != 0) {
      return false
    }

    return true
  }

  /**
   * Checks if constructor has at least one  DI annotation.
   */
  private function ctorHasDIAnnotations(c : IConstructorInfo) : Boolean {
    final var targets = Reflection.allAnnotationTypes(c)
    return  GW_TYPES.hasMatch(\ t  -> targets.contains(t))
  }
}
