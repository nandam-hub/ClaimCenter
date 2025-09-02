package edge.util.either
uses java.lang.IllegalStateException
uses java.lang.Iterable
uses java.util.ArrayList

/**
 * Either case class. Similar to Either monad, but not a monad yet.
 * @param L type for left value.
 * @param R type for right value.
 */
final class Either<L, R> {
  /** Left value holder. */
  private var _left : L;
  
  /** Right value holder. */
  private var _right : R;
  
  /** 
   * Flag, indicating that this is a left-value. 
   * Both left and right values can be null (one is actual null value
   * and second is default) so explicit flag is needed.
   */
  private var _isLeft : Boolean
  
  private construct(l : L, r : R, lft : Boolean) {
    this._left = l
    this._right = r
    this._isLeft = lft
  }
  
  /**
   * Property identifying that this value is a left value.
   */
  property get isLeft() : Boolean {
    return _isLeft;
  }
  
  /**
   * Property indicating that this value is a right value.
   */
  property get isRight() : Boolean {
    return !isLeft
  }
  
  /**
   * Returns a left value iff this is a left value.
   * @throws IllegalStateException if this object represents a right value.
   */
  property get left() : L {
    if (!isLeft) {
      throw new IllegalStateException("This is a right value")
    }
    return _left
  }

  /**
   * Returns a right value iff this is a right value.
   * @throws IllegalStateException if this object represents a left value.
   */
  property get right() : R {
    if (!isRight) {
      throw new IllegalStateException("This is a left value")
    }
    return _right
  }
  
  /**
   * Mapper for the left value.
   */
  reified function mapLeft<L1>(f(arg: L) : L1) : Either<L1, R> {
    if (isLeft) {
      // Diamond is too weak and cannot figure out proper types if static method is used :(
      return new Either<L1, R>(f(_left), null, true)
    }
    return new Either<L1, R>(null, _right, false)
  }
  
  /**
   * Mapper for the right value (common functor).
   */
  reified function mapRight<R1>(f:(arg: R) : R1) : Either<L, R1> {
    if (isLeft) {
      return new Either<L, R1>(_left, null, true)
    }
    return new Either<L, R1>(null, f(_right), false)
  }
  
  /**
   * Monadic application, (common monad).
   */
  reified function mmapRight<R1>(f : (arg :R) : Either<L, R1>) : Either<L, R1> {
    if (isLeft) {
      return new Either<L, R1>(_left, null, true)
    }
    
    return f(_right)
  }
  
  
  /* Alias for mapRight. */
  reified function map<R1>(f : (arg: R) : R1) : Either<L, R1> {
    return mapRight(f)
  }

  /**
   * Creates a "left value" instance.
   */
  public static reified function left<L1, R1>(value : L1) : Either<L1, R1> {
    return new Either<L1, R1>(value, null, true)
  }
  
  /**
   * Creates a "right value" instance.
   */
  public static reified function right<L1, R1>(value : R1) : Either<L1, R1> {
    return new Either<L1, R1>(null, value, false)
  }

  /**
   * Aggregates all the values into either a set of errors or a global success. The return value is Left if there
   * is at least one Left value in the <code>items</code>. Otherwise the return value is Right with all the values from
   * <code>items</code>. For empty list Right with an empty list is returned.
   */
  public static reified function reduceList<L1, R1>(items : Iterable<Either<L1, R1>>) : Either<List<L1>, List<R1>> {
    final var errs = new ArrayList<L1>()
    final var succs = new ArrayList<R1>()

    final var itr = items.iterator()
    while (itr.hasNext()) {
      final var item = itr.next()
      if (item.isLeft) {
        errs.add(item.left)
      } else {
        succs.add(item.right)
      }
    }

    if (!errs.Empty) {
      return Either.left(errs)
    } else {
      return Either.right(succs)
    }
  }
  
  override function toString() : String {
    return isLeft ? "left:" + left : "right:" + right
  }
}
