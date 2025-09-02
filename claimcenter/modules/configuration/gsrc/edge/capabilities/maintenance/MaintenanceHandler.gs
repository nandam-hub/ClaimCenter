package edge.capabilities.maintenance

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.AbstractRpcHandler
uses edge.doc.ApidocAvailableSince
uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod

class MaintenanceHandler extends AbstractRpcHandler {

  @InjectableNode
  construct(){
  }

  @ApidocMethodDescription("Return the value of the EnableEdgeMaintenanceMode script parameter.")
  @ApidocAvailableSince("2023.6.0")
  @JsonRpcUnauthenticatedMethod
  public function checkMaintenanceMode(): Boolean {
    return ScriptParameters.EnableEdgeMaintenanceMode
  }
}
