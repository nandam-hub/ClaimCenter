package edge.servlet.jsonrpc.marshalling.extensions.deserializer

uses com.fasterxml.jackson.databind.JsonDeserializer
uses edge.servlet.jsonrpc.marshalling.extensions.dto.TestExtensionValueDTO
uses edge.capabilities.currency.dto.AmountDTO
uses com.fasterxml.jackson.databind.DeserializationContext
uses com.fasterxml.jackson.core.JsonParser
uses java.lang.Integer
uses edge.di.annotations.InjectableNode

/**
* Example deserializer that is used to demonstrate adding a custom deserializer to the framework (in serialization.gwproperties).
* This is an illustrative basic Jackson deserializer - other implementations may wish to use more complex behaviour.
*/
class TestExtensionValueDTODeserializer extends JsonDeserializer<TestExtensionValueDTO> {

  @InjectableNode
  construct(){
    super()
  }

  override function deserialize(p: JsonParser, ctxt: DeserializationContext): TestExtensionValueDTO {
    var _amountDeserializer = ctxt.findRootValueDeserializer(ctxt.constructType(AmountDTO))
    var result = new TestExtensionValueDTO()
    var currentToken = p.nextValue()

    while(currentToken != null && !currentToken.StructEnd){
      switch(p.CurrentName){
        case "name":
          result.Name = p.getText()
          break
        case "categoryPriority":
          result.CategoryPriority = new Integer(p.getIntValue())
          break
        case "updated":
          var updated = p.getText()
          result.Updated = updated.equals("true")
          break
        case "amount":
          var amount = _amountDeserializer.deserialize(p, ctxt) as AmountDTO
          result.Amount = amount
          break
      }
      currentToken = p.nextValue()
    }

    result.Name = result.Name + "custom-deserialize"
    return result
  }
}
