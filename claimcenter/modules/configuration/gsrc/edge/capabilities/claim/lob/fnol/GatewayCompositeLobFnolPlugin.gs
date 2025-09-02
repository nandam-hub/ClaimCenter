package edge.capabilities.claim.lob.fnol


uses edge.di.annotations.ForAllGwNodes

class GatewayCompositeLobFnolPlugin extends CompositeLobFnolPlugin {

  @ForAllGwNodes("gatewayfnol")
  construct() {
    super("gatewayfnol")
  }

}
