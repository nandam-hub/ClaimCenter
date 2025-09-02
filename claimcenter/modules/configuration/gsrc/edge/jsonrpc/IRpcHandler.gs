package edge.jsonrpc

/**
 * Interface for all RPC handlers (they can be bound to other protocols, not just JSON/RPC).
 *
 * <h1>RPC handler definition</h1>
 * <p>
 *   All RPC classes must have exactly one "injectable" constructor (annotated with InjectableNode) to be able to
 *   be constructed by the DI library. All public methods with JsonRpcMethod or JsonRpcUnauthenticatedMethod annotation
 *   could be called by RPC clients. All other methods (non-public ones or not properly annotated) will not be available
 *   to external users.
 * </p>
 * <p>
 *   No method overloading is supported. In other words, at most one method with the same name is allowed to be exposed
 *   to the user. Classes having two RPC methods with the same name will be flagged as an error during the startup.
 *   However, it is possible to have overloaded methods as long as only one of them is exposed to the caller. For
 *   example, following code is valid:
 *   <code>
 *     public function doGreatGood(numberOfGoodDeeds : Int) {
 *        ...
 *     }
 *
 *     @JsonRpcMethod
 *     public function doGreatGood() {
 *       doGreatGood((int) (Math.random() * 42) + 1)
 *     }
 *   </code>
 *   and following one is not:
 *   <code>
 *     @JsonRpcMethod
 *     public function doGreatGood(numberOfGoodDeeds : Int) {
 *        ...
 *     }
 *
 *     @JsonRpcMethod
 *     public function doGreatGood() {
 *       doGreatGood((int) (Math.random() * 42) + 1)
 *     }
 *   </code>
 * </p>
 */
interface IRpcHandler {

  function getMetaData(): Object
}
