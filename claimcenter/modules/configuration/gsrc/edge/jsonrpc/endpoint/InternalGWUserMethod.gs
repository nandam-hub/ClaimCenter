package edge.jsonrpc.endpoint

uses java.lang.IllegalArgumentException
uses edge.security.EffectiveUser
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.lang.reflect.IMethodInfo
uses gw.lang.reflect.IType
uses edge.PlatformSupport.Bundle

/**
 * For methods annotated with the @JsonRpcRunAsInternalGWUser
 */
class InternalGWUserMethod implements IEndpointMethod {

    /**
     * Peer method used for delegation.
     */
    private var _peer : IEndpointMethod


    internal construct(peer : IEndpointMethod) {
      if (peer == null) {
        throw new IllegalArgumentException("Peer endpoint method could not be null")
      }
      this._peer = peer
    }

  override function call(user: EffectiveUser, args: List<Object>): Object {
    if (user.InternalGWUser == null) {
      throw new JsonRpcSecurityException(){: Message = "Method requires an authenticated internal gw user"}
    }
    return _peer.call(user, args)
  }

  override function getArgumentTypes(): List<IType> {
    return _peer.getArgumentTypes()
  }

  override function getMethodInfo() : IMethodInfo {
    return _peer.getMethodInfo()
  }
}
