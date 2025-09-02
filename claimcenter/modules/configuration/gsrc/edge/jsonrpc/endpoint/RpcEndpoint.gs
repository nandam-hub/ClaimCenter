package edge.jsonrpc.endpoint

uses java.util.Map
uses java.util.Collections

/**
 * Remote procedure call endpoint (RPC object with callable methods).
 */
final class RpcEndpoint {

  /** Endpoint methods contained by this RPC endpoint. */
  private var _methodMap : Map<String, IEndpointMethod>

  /**
   * Creates a new endpoint using provided methods as endpoint methods.
   */
  internal construct(methodMap : Map<String, IEndpointMethod>) {
    this._methodMap = Collections.unmodifiableMap(methodMap)
  }

  /** Returns a map from method map to a method endpoint (handler). Returned map would be unmodifiable one. */
  function getMethodMap() : Map<String, IEndpointMethod> {
    return _methodMap
  }
}
