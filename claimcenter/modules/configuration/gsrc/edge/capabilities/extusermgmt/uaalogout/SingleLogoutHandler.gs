package edge.capabilities.extusermgmt.uaalogout

uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.di.annotations.InjectableNode
uses edge.uaaoperations.UaaUserOperationsPlugin
uses edge.security.EffectiveUserProvider
uses edge.jsonrpc.annotation.JsonRpcMethod

class SingleLogoutHandler extends AbstractRpcHandler {

  private var _uaaUserOperationsPlugin : UaaUserOperationsPlugin
  var _userProvider : EffectiveUserProvider as readonly UserProvider

  @InjectableNode
  @Param("uaaUserOperationsPlugin", "Plugin that provides communication with UAA (to revoke the tokens)")
  @Param("aUserProvider", "Plugin provides access to the EffectiveUser")
  construct(uaaUserOperationsPlugin : UaaUserOperationsPlugin, aUserProvider:EffectiveUserProvider) {
    _uaaUserOperationsPlugin = uaaUserOperationsPlugin
    _userProvider = aUserProvider
  }

  @JsonRpcMethod
  @ApidocMethodDescription("Supports Single Logout by requesting UAA destroy all of a user's tokens")
  @ApidocAvailableSince("6.0")
  public function logout(){
    if (ScriptParameters.EnablePortalSingleSignOff){
      var userId = _userProvider.EffectiveUser.UaaUserId
      _uaaUserOperationsPlugin.logoutUser(userId)
    }
  }
}
