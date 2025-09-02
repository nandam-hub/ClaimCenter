package edge.di.boot
uses java.util.Set
uses edge.di.CapabilityAndPath
uses gw.lang.reflect.IType
uses edge.util.either.Either
uses java.util.Map
uses java.util.concurrent.atomic.AtomicReference
uses java.util.concurrent.locks.ReentrantLock
uses java.lang.RuntimeException

/** 
 * Portal bootstrapping class.
 */
final class Bootstrap {

  /**
   * Reference to an instance of the DI container. Due to lack of volatile keyword/annotation in gosu we have
   * to use atomic refs.
   */
  private static var CONTAINER = new AtomicReference<Either<List<String>, DependencyContainer>>(createDIContainer())


  /** Another gosu-specific workaround caused by lack of the synchronized methods/keywords. */
  private static var LOCK = new ReentrantLock()


  private construct() {

  }

  /**
   * Returns a current state of the bootstrap. It could be refreshed by the reload method.
   */
  public static function getStatus() : Either<List<String>, DependencyContainer> {
    return CONTAINER.get()
  }


  /**
   * Returns a dependency injection container.
   */
  public static property get InjectionContainer() : DependencyContainer {
    final var holder = CONTAINER.get()
    if (holder.isLeft) {
      throw new RuntimeException("Invalid portal configuration caused by " + holder.left.size() + " config errors")
    }
    return holder.right
  }


  /** Returns all paths registered in configuration files. */
  public static property get AllConfigKeys() : Set<CapabilityAndPath> {
    return InjectionContainer.ConfigurationKeys
  }
  
  /**
   * Tries to create a node for the target path and type.
   */
  public static function createNode(path : CapabilityAndPath, goal : IType) : Either<List<String>, Object> {
    return InjectionContainer.createNode(path, goal)
  }


  /**
   * Bootstraps a map (like handler map) starting from specific capability and prefix.
   * Only keys one level "below" query are loaded and simple name is used as a key.
   */
  @Deprecated("Function of this method shoud be implemented by DI framework.")
  public static reified function createMap<T>(query : CapabilityAndPath) : Either<List<String>, Map<String, T>> {
    return InjectionContainer.createMap<T>(query);
  }

  /**
   * Bootstraps a map (like handler map) starting from specific capability and prefix.
   * Only keys one level "below" query are loaded and simple name is used as a key.
   * Throws an exception if map could not be created.
   */
  @Deprecated("Function of this method shoud be implemented by DI framework.")
  public static reified function forceCreateMap<T>(query : CapabilityAndPath) : Map<String, T> {
    return InjectionContainer.forceCreateMap<T>(query);
  }

  /**
   * Reloads a DI configuration.
   */
  @Deprecated("Do not use in production environment")
  public static function reload() : Either<List<String>, DependencyContainer> {
    /* Use strictly sequential order to prevent possible races where non-last config is saved. */
    using(LOCK) {
      final var res = createDIContainer()
      CONTAINER.set(res)
      return res
    }
  }

  /**
   * Implementation of the container factory.
   */
  private static function createDIContainer() : Either<List<String>, DependencyContainer> {
    return ConfigBoot.loadPortalConfiguration().map(\conf -> DependencyContainer.create(conf))
  }
}
