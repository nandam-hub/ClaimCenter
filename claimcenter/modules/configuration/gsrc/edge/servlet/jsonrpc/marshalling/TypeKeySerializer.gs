package edge.servlet.jsonrpc.marshalling

uses com.fasterxml.jackson.core.JsonGenerator
uses com.fasterxml.jackson.databind.JsonSerializer
uses com.fasterxml.jackson.databind.SerializerProvider
uses gw.entity.TypeKey

uses java.lang.Class

/**
 * Jackson serializer for type keys. Serializes a typekey {@code v} to as a string containing its code {@code v.Code}.
 */
internal class TypeKeySerializer extends JsonSerializer<TypeKey> {
  override function handledType(): Class<TypeKey> {
    // Returns the base type of any typekey
    return gw.entity.TypeKey as Class<gw.entity.TypeKey>
  }

  override function serialize(v: TypeKey, jgen: JsonGenerator, serializer: SerializerProvider) {
    if ( v == null ) {
      jgen.writeNull()
    } else {
      jgen.writeString(v.Code)
    }
  }
}
