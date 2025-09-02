package edge.security.authorization
/**
 * Convenience methods for the authorizers.
 */
enhancement AuthorizerEnhancement<T> : edge.security.authorization.Authorizer<T> {
  
  /**
   * Tries to access item in the given context.
   */
  @Param("item", "Item to access")
  @Returns("<code>null</code> if <code>item</code> is <code>null</code> or is not accessible." +
           "<code>item</code> otherwise")
  public reified function access(item : T) : T {
    return (item != null && this.canAccess(item)) ? item : null
  }
  
  
  
  /**
   * Batch version of item accessor. Returns only accessible items.
   */
  @Param("items", "Items to access")
  @Returns("Array of accessible items. Returns empty array if <code>items</code> is <code>null</code>")
  public reified function access(items : T[]) : T[] {
    return items == null ? {} : items.where(\ item -> this.canAccess(item))
  }
}
