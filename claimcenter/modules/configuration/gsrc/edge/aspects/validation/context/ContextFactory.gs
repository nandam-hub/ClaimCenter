package edge.aspects.validation.context

/** Factory used to generate a context. */
abstract class ContextFactory {
  internal construct() {}

  /** Creates a new context with the given parent.
   * @param parentContext parent context to inherit data from.
   * @param exprArgs arguments to the expressions used in the context. These arguments are defined by the context's
   * user.
   */
  abstract function createContext(parentContext : ContextAspect, exprArgs : Object[]) : ContextAspect
}
