package edge.capabilities.usergen

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.AbstractRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses gw.api.data.RoleProvider
uses gw.api.data.UserProvider
uses gw.api.system.PLConfigParameters

class UsergenHandler extends AbstractRpcHandler {

  @InjectableNode
  construct() {
  }

  function throwIfDisabled() {
    if (!PLConfigParameters.EnableInternalDebugTools.getValue()) {
      throw new JsonRpcSecurityException()
    }
  }

  @JsonRpcMethod
  public function generatePortalUser() {
    throwIfDisabled()
    new RoleProvider().load()
    new UserProvider().load()
  }
}
