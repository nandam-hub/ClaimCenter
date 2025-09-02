package edge.servlet.security

uses edge.di.annotations.ForAllGwNodes
uses java.util.Set
uses edge.Plugin.pcintegration.pc1000.ProducerCodeRetrieverPlugin
uses edge.wsi.remote.gw.webservice.pc.pc1000.edgeproducerapi.types.complex.ProducerCodeDTO

/**
 * Default implementation for the user producer code retrieval plugin.
 */
class DefaultUserProducerCodeRetrievalPlugin implements IUserProducerCodeRetrievalPlugin {
  private var producerCodeRetrieverPlugin: ProducerCodeRetrieverPlugin

  @ForAllGwNodes
  construct() {
    producerCodeRetrieverPlugin = new ProducerCodeRetrieverPlugin ()
  }

  override function getUserProducerCodes(user: String): List<String> {
    return producerCodeRetrieverPlugin.retrieveProducerCodesByUserName(user).map(
      \ producerCode -> producerCode.Code
    )
  }
}
