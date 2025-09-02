package edge.Plugin.pcintegration.pc1000

uses java.util.Map
uses gw.plugin.InitializablePlugin
uses edge.wsi.remote.gw.webservice.pc.pc1000.edgeproducerapi.types.complex.ProducerCodeDTO
uses edge.wsi.remote.gw.webservice.pc.pc1000.edgeproducerapi.EdgeProducerAPI

class ProducerCodeRetrieverPlugin implements InitializablePlugin {

  function retrieveProducerCodesByUserName(userName : String) : List<ProducerCodeDTO>{

    return ProducerCodeService.getProducerCodesByUserName(userName)

  }

  private property get ProducerCodeService() : EdgeProducerAPI  {

    var pcService = new EdgeProducerAPI()

    return pcService
  }

  override property set Parameters(params: Map) {

  }
}
