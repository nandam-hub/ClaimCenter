package edge.servlet.jsonrpc.marshalling.extensions.dto

uses java.util.HashMap
uses edge.jsonmapper.JsonProperty

/**
* Example DTO used to demonstrate how you would add a custom deserializer to the framework (see serialization.gwproperties).
* Two structures are provided - the inner DTO and an array. The inner DTO has its own deserializer,
* which is called to create new instances.
*/
class TestExtensionDTO {

  @JsonProperty
  var _testDTO : TestExtensionValueDTO as TestDTO

  @JsonProperty
  var _testDTOs : TestExtensionValueDTO[] as TestDTOs

}
