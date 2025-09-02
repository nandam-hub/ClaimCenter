package edge.jsonrpc.endpoint

uses edge.security.EffectiveUser
uses gw.lang.reflect.IMethodInfo
uses gw.lang.reflect.IType

/**
 * Handler for RPC invocation "endpoint" (method on a particular object). This interface isolates different kinds
 * of methods (synthetic methods, object methods, etc...) and provides a single interface. This invocation handler
 * is intended to be used inside jsonrpc package only.
 */
interface IEndpointMethod {
  /**
   * Calls an endpoint (performs endpoint operation). <code>args</code> have the same format as <code>args</code> for
   * {@link RpcEndpoint#call(String, List<Object>)}.
   */
  @Param("user", "Current portal user. This user could be <code>null</code>")
  @Param("args", "List of call arguments.")
  @Returns("Result of the call. Returns <code>null</code> for void methods.")
  function call(user : EffectiveUser, args : List<Object>) : Object

  /** Returns a list of argument types required by this endpoint. */
  @Returns("Argument types in the order required by the call method.")
  function getArgumentTypes() : List<IType>

  /** Returns a the method information. */
  @Returns("Method information.")
  function getMethodInfo() : IMethodInfo
}

