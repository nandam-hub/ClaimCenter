package edge.servlet.jsonrpc.marshalling.extensions.samplehandler

uses edge.jsonrpc.AbstractRpcHandler
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.doc.ApidocMethodDescription
uses edge.doc.ApidocAvailableSince
uses edge.servlet.jsonrpc.marshalling.extensions.dto.TestExtensionDTO
uses edge.servlet.jsonrpc.marshalling.extensions.dto.TestExtensionValueDTO
uses edge.capabilities.currency.dto.AmountDTO

class SampleSerializationExtensionHandler extends AbstractRpcHandler {

  @InjectableNode
  construct() {
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("An example handler endpoint to illustrate adding custom deserializers to the serialization framework.")
  @ApidocAvailableSince("8.0")
  public function callExampleArrayAPIMethod( dto : TestExtensionDTO ) : TestExtensionDTO {
    var sampleValueDTO = new TestExtensionValueDTO(){
      :Amount = new AmountDTO(){
        :Amount = 55.00,
        :Currency = Currency.TC_USD
      },
      :CategoryPriority = 5,
      :Name = "Sample"
    }

    return dto
  }

  @JsonRpcUnauthenticatedMethod
  @ApidocMethodDescription("An example handler endpoint to illustrate adding custom deserializers to the serialization framework.")
  @ApidocAvailableSince("8.0")
  public function callExampleAPIMethod( dto : TestExtensionValueDTO ) : TestExtensionValueDTO {
    dto.CategoryPriority++
    return dto
  }
}
