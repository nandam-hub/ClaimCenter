package edge.util.memo
uses java.util.Map
uses java.util.HashMap

/**
 * Memorization implementation for sinlge-arg function. Supports both
 * <code>null</code> arguments and return values.
 */
final class Memo1<T, R> {
  
  /** Memo provider. */
  private var _provider : block(x : T) : R
  
  /** Result storage. */
  private var _cache : Map<T, R> = new HashMap<T, R>()

  private construct(peer : (x : T) : R) {
    this._provider = peer
  }
  
  /**
   * Gets a value. Caches all returned values so peer is
   * not used if value was already evaluated.
   */
  function apply(x : T) : R {
    if (_cache.containsKey(x)) {
      return _cache.get(x)
    }
    
    final var result = _provider(x)
    _cache.put(x, result)
    return result
  }
  
  
  /** Creates a memorization function for the original one. */
  static reified function makeBlock<T1, R1>(f : (x : T1) : R1) : block(x : T1) : R1 {
    final var memo = new Memo1<T1, R1>(f)
    return \x -> memo.apply(x)
  }


  /** Creates a memorizaton item. */
  static reified function makeMemo<T1, R1>(f : (x : T1) : R1) : Memo1<T1, R1> {
    return new Memo1<T1, R1>(f)
  }
}
