package edge.di.solver
uses gw.lang.reflect.IType
uses java.lang.Iterable
uses gw.util.Pair
uses java.util.HashMap
uses edge.util.MapUtil
uses java.util.ArrayList
uses java.util.Map
uses gw.lang.reflect.TypeSystem

/**
 * Provider for class/interface implementation. Provides all available types
 * with associated metadata.
 */
internal final class ImplementationProvider {


  private var _impls : Map<IType, List<TypeMetadata>>

  private construct(impls : Map<IType, List<TypeMetadata>>) {
    this._impls = impls
  }


  /**
   * Returns types which can be used as an implementation for the given type.
   */
  function getCandidates(type : IType) : List<TypeMetadata>  {
    final var guess = _impls.get(type)
    return guess != null ? guess : {}
  }


  /**
   * Creates net implementation provider using a given type analyzer. Uses "default" list of
   * types for the discovery.
   */
  public static function create(analyzer : (x : IType) : TypeMetadata) : ImplementationProvider {
    final var typeLoader = ImplementationProvider.Type.TypeLoader
    final var allEligibleTypes = typeLoader.AllTypeNames
      .where(\tn -> isProbablyAvailableForDI(tn.toString()))
      .map(\ n -> TypeSystem.getByFullNameIfValid(n.toString()))
    return create(analyzer, allEligibleTypes)
  }
  

  /**
   * Creates a new implementation provider using type analyzer and a list of 
   * eligible types.
   */  
  public static function create(
        analyzer : (x : IType) : TypeMetadata, 
        types : Iterable<IType>) : ImplementationProvider {
    final var typesWithMeta = types.toList()
      .map(\ t -> Pair.make(t, analyzer(t)))
      .where(\t -> t.Second != null)
    final var implMap = new HashMap<IType, List<TypeMetadata>>()
    for (var typeWithMeta in typesWithMeta) {
      for (var eligibleType in typeWithMeta.First.AllTypesInHierarchy) {
        MapUtil
          .getOrUpdate(implMap, eligibleType, \ -> new ArrayList<TypeMetadata>())
          .add(typeWithMeta.Second)
      }
    }
    return new ImplementationProvider(implMap)
  }
  
  
  /**
   * Checks if a type name denotes a type which could be created by the DI.
   * This method checks name only (and do not fetch IType for the type), so
   * this check is not precise.
   * <p>The main use-case for this method is to filter-out definitely 
   * non-injectable types. This (default) implementation treats following
   * types as non-injectable:
   * <ul>
   *   <li>wsi.* types. These types are used for web services and should have only 
   *       web-sevrice-specific functionality which is of no use to portals
   *       (due to Single Responsibility Principle).
   *   <li>gw.* types. This is a core product package and model. However, that package do
   *       not support portal Dependency Injection. This is also discouraged to put 
   *       customer's code into that package because these changes would be quite hard to track.
   *       Portal code should reside in non-gw package (edge or some customer-specific one).
   * </ul>
   */
  private static function isProbablyAvailableForDI(name : String) : boolean {
    if (name.startsWith("gw.") || name.startsWith("wsi.")) {
      return false
    }
    return true
  }
}
