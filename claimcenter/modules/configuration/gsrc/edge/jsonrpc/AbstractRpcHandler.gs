package edge.jsonrpc

uses edge.doc.ApidocMethodDescription
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.jsonrpc.endpoint.EndpointUtil

abstract class AbstractRpcHandler implements IRpcHandler {

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("Returns the metadata for the handler's input and output types")
  function getMetaData(): Object {
    return EndpointUtil.generateMetadataForHandler(this)
  }
}
