package edge.util.lazy

/** Thread-unsafe implementation of lazy values. */
internal final class ThreadUnsafeLazyValue<T> implements LazyValue<T> {
  private var _v : T
  private var _factory() : T

  internal construct(f() : T) {
    this._factory = f
  }

  override property get Value(): T {
    if (_factory != null) {
      _v = _factory()
      _factory = null
    }
    return _v
  }
}
