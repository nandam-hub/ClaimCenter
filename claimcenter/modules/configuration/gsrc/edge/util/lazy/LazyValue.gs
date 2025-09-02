package edge.util.lazy

/**
 * Value which is calculated on the first access.
 */
interface LazyValue<T> {
  /** Returns value of this lazy item. */
  public property get Value() : T
}
