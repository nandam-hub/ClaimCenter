package edge.di

uses gw.lang.reflect.IType

/**
 * Rule defining both capability and path.
 */
final class CapabilityAndPath {

  /** Capability name for the item. */
  private var capability : String as Capability

  /** Path to the node in question. */
  private var path : Path as Path

  /** type specified by a wildcard rule. */
  private var wildCardType : IType as WildcardType

  construct(cap : String, p : Path) {
    this.capability = cap
    this.path = p
  }

  construct(cap : String, _wildCardType : IType) {
    this.capability = cap
    this.wildCardType = _wildCardType
    this.path = Path.WILDCARD_PATH
  }

  function sub(part : String) : CapabilityAndPath {
    return new CapabilityAndPath(capability, path.sub(part))
  }


  override function hashCode() : int {
    return capability.hashCode() * 31 + path.hashCode()
  }

  override function equals(other : Object) : boolean {
    if (!(other typeis CapabilityAndPath)) {
      return false
    }

    final var o = other as CapabilityAndPath

    if (capability == null && o.capability != null || capability != null && !capability.equals(o.capability)) {
      return false
    }

    if (path == null && o.path != null || path != null && !path.equals(o.path)) {
      return false
    }

    return true
  }

  override function toString() : String {
    return capability + "::" + path
  }
}
