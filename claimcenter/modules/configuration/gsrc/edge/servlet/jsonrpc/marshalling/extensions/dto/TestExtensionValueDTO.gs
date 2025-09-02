package edge.servlet.jsonrpc.marshalling.extensions.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer
uses edge.capabilities.currency.dto.AmountDTO

/**
* Example DTO used to demonstrate how you would add a custom deserializer to the framework (see serialization.gwproperties).
*/
class TestExtensionValueDTO {

  @JsonProperty
  var _name : String as Name

  @JsonProperty
  var _updated : boolean as Updated

  @JsonProperty
  var _categoryPriority : Integer as CategoryPriority

  @JsonProperty
  var _amount : AmountDTO as Amount

}
