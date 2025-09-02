package edge.PlatformSupport

uses gw.util.concurrent.LockingLazyVar

/**
 * Laziness support for different platforms. Lazy val was renamed in the emerald platform.
 */
final class Laziness {
  public static reified function lazy<T>(initializer() : T) : LockingLazyVar<T> {
    return LockingLazyVar.make(initializer)
  }
}
