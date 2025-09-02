package edge.di.boot

uses java.util.Set
uses edge.di.CapabilityAndPath
uses edge.di.solver.Solver
uses gw.lang.reflect.IType
uses edge.util.either.Either
uses java.util.Map
uses edge.util.MapUtil
uses java.lang.RuntimeException
uses java.util.Collections

/**
 * A dependency configuration container storing all the configuration rules and able to create implementations of
 * specific nodes.
 *
 * <p>Note that there is no guarantee that a new node will be created or an existing node will be returned.
 */
final class DependencyContainer {
  /**
   * All configuration keys (paths) having at least one path-specific rule defined.
   */
  private var _configKeys : Set<CapabilityAndPath> as readonly ConfigurationKeys

  /**
   * Builder for the DI nodes.
   */
  private var _nodeBuilder : NodeBuilder


  /**
   * Creates a new instance of the dependency container. Not public due to a high probability of API change.
   */
  private construct(confKeys : Set<CapabilityAndPath>, nb : NodeBuilder) {
    this._configKeys = Collections.unmodifiableSet(confKeys)
    this._nodeBuilder = nb
  }


  /**
   * Tries to create a node for the target path and type.
   * @param path path (key) of the node to create.
   * @param goal expected type of the node.
   * @returns node creation result - a list of errors or a created node.
   */
  public function createNode(path : CapabilityAndPath, goal : IType) : Either<List<String>, Object> {
    return _nodeBuilder.findNode(path, goal)
  }


  /**
   * Bootstraps a map (like handler map) starting from specific capability and prefix.
   * Only keys one level "below" query are loaded and simple name is used as a key.
   * @param T expected type of map value.
   * @param query prefix defining a "map" node. Map will be created for rules of type
   *   <code>query.key</code> where key is a simple name corresponding to a map key and rule target defines an
   *     object to be instantiated as a node value.
   * @returns a map instantiation result
   */
  @Deprecated("Function of this method shoud be implemented by DI framework.")
  public reified function createMap<T>(query : CapabilityAndPath) : Either<List<String>, Map<String, T>> {
    final var eligibleNodes = _configKeys.where(
        \ elt -> elt.Capability == query.Capability && elt.Path.Parent == query.Path)

    final var eltMap = MapUtil.groupUnique<CapabilityAndPath, String, Either<List<String>, Object>>(eligibleNodes, \path -> path.Path.Name, \path -> createNode(path, T.Type))

    final var errors = eltMap.entrySet()
        .where(\e -> e.Value.isLeft)
        .flatMap( \ elt ->
            elt.Value.left.map(\err -> "Could not create node " + elt.Key + ": " + err))
        .toList()

    if (!errors.Empty) {
      return Either.left<List<String>, Map<String, T>>(errors)
    }

    return Either.right<List<String>, Map<String, T>>(eltMap.mapValues( \ value -> value.right as T))
  }

  /**
   * Bootstraps a map (like handler map) starting from specific capability and prefix.
   * Only keys one level "below" query are loaded and simple name is used as a key.
   * Throws a RuntimeException if map could not be created.
   * @param T expected type of map value.
   * @param query prefix defining a "map" node. Map will be created for rules of type
   *   <code>query.key</code> where key is a simple name corresponding to a map key and rule target defines an
   *     object to be instantiated as a node value.
   * @returns a map instantiation result
   */
  @Deprecated("Function of this method shoud be implemented by DI framework.")
  public reified function forceCreateMap<T>(query : CapabilityAndPath) : Map<String, T> {
    final var res = createMap<T>(query)
    if (res.isRight) {
      return res.right
    }

    throw new RuntimeException("Could not create map, following errors found :\n\t" + res.left.join("\n\t"))
  }


  /**
   * Creates a new dependency (configuration) container based on the specific portal config.
   * @param config portal configuration to use.
   * @returns a dependency container based on the <code>config</code>.
   */
  internal static function create(config : PortalConfig) : DependencyContainer {
    final var allKeys =
        config.PublicRules.concat(config.PrivateRules)
            .map( \ elt -> elt.First)
            .toSet()

    final var solver = Solver.createSolver(config.PublicRules, config.PrivateRules)
    final var nb = new NodeBuilder(solver)

    return new DependencyContainer(allKeys, nb)
  }
}
