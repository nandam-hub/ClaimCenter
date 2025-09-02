package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.databind.JsonDeserializer
uses com.fasterxml.jackson.databind.deser.ContextualDeserializer
uses com.fasterxml.jackson.databind.DeserializationContext
uses com.fasterxml.jackson.databind.BeanProperty
uses com.fasterxml.jackson.core.JsonParser

class MapValueArrayDeserializer extends JsonDeserializer<Object> implements ContextualDeserializer {

  var deserializer : JsonDeserializer
  override function createContextual(ctxt: DeserializationContext, beanProp: BeanProperty): JsonDeserializer< Object > {
    var wrapperType = beanProp.getType()
    var keyType = wrapperType.getKeyType()
    var valueArrayType = wrapperType.getContentType()
    var asClass = valueArrayType.getRawClass()

    deserializer = ctxt.findRootValueDeserializer(ctxt.constructType(asClass))
    return deserializer;
  }

  // This doesn't actually get called as we have already delegated via the createContextual function. Needs to be here to fulfil contract - would perform the same job.
  override function deserialize(p: JsonParser, ctxt: DeserializationContext): Object {
    return deserializer.deserialize(p, ctxt)
  }
}
