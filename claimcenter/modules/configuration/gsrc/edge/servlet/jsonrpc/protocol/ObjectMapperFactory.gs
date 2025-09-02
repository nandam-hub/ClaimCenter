package edge.servlet.jsonrpc.protocol

uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.databind.ObjectMapper
uses com.fasterxml.jackson.databind.SerializationFeature
uses com.fasterxml.jackson.databind.util.ISO8601DateFormat
uses edge.servlet.jsonrpc.marshalling.GosuModule

class ObjectMapperFactory {
  public static function createObjectMapper(): ObjectMapper {
    var mapper = new ObjectMapper()
    mapper.registerModule(GosuModule.INSTANCE)
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
    mapper.setDateFormat(new ISO8601DateFormat())
    mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
    mapper.setDefaultPropertyInclusion(JsonInclude.Value.construct(JsonInclude.Include.NON_NULL, JsonInclude.Include.ALWAYS));
    return mapper
  }
}
