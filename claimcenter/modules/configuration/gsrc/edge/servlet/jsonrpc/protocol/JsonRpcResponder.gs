package edge.servlet.jsonrpc.protocol

uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.core.JsonFactory
uses com.fasterxml.jackson.core.JsonGenerator
uses com.fasterxml.jackson.databind.ObjectMapper
uses com.fasterxml.jackson.databind.SerializationFeature
uses com.fasterxml.jackson.databind.util.ISO8601DateFormat
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.exception.JsonRpcErrorCode
uses edge.jsonrpc.exception.JsonRpcException
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses edge.servlet.jsonrpc.marshalling.GosuModule

uses jakarta.servlet.http.HttpServletResponse
uses java.io.BufferedWriter
uses java.io.IOException

/**
 * Responder for the JsonRpc methods. Know how to set json-rpc response or error.
 */
final class JsonRpcResponder {

  private static final var _mapper = createObjectMapper()

  private static function createObjectMapper(): ObjectMapper {
    var mapper = new ObjectMapper()
    mapper.registerModule(GosuModule.INSTANCE)
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
    mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)
    mapper.setDateFormat(new ISO8601DateFormat())
    mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
    mapper.setDefaultPropertyInclusion(JsonInclude.Value.construct(JsonInclude.Include.NON_NULL, JsonInclude.Include.ALWAYS));
    return mapper
  }

  static function setSuccessfulResponse(final resp: HttpServletResponse, final response: JsonRpcResponse) {
    respond(resp, response)
  }

  static function setErrorResponse(final resp: HttpServletResponse, final error: JsonRpcException, final jsonRpcRequestId: Object) {
    var errorCode = getHttpHeaderResponseErrorCode(error)
    resp.setStatus(errorCode)
    respond(resp, new JsonRpcResponse(error, jsonRpcRequestId))
  }
  
  static function setObfuscatedErrorResponse(final resp: HttpServletResponse, error: JsonRpcException,  final jsonRpcRequestId: Object) {
    var errorCode = getHttpHeaderResponseErrorCode(error)
    resp.setStatus(errorCode)
    respond(resp, new JsonRpcResponse("There was an issue", jsonRpcRequestId))
  }

  /**
   * Maps the json rpc exceptions to a http header response code
   *
   * @param e JsonRpcException Exception that has been thrown while processing the request
   * @return The http header response code
   */
  private static function getHttpHeaderResponseErrorCode(e: JsonRpcException): int {
    switch (e.JsonRpcError) {
      case JsonRpcErrorCode.INVALID_PARAMS:
      case JsonRpcErrorCode.PARSE_ERROR:
        return HttpServletResponse.SC_BAD_REQUEST
      case JsonRpcErrorCode.AUTHENTICATION_ERROR:
        return HttpServletResponse.SC_UNAUTHORIZED
      case JsonRpcErrorCode.INTERNAL_ERROR:
      case JsonRpcErrorCode.APPLICATION_ERROR:
      case JsonRpcErrorCode.SYSTEM_ERROR:
      case JsonRpcErrorCode.TRANSPORT_ERROR:
        return HttpServletResponse.SC_INTERNAL_SERVER_ERROR
      case JsonRpcErrorCode.INVALID_REQUEST:
      case JsonRpcErrorCode.METHOD_NOT_FOUND:
        return HttpServletResponse.SC_NOT_IMPLEMENTED
      default:
        return HttpServletResponse.SC_BAD_REQUEST
    }
  }

  /**
   * creates JSON response
   *
   * @param httpServletResponse HttpServletResponse
   * @param jsonRpcResponse     JsonRpcResponse
   */
  private static function respond(httpServletResponse: HttpServletResponse, jsonRpcResponse: JsonRpcResponse) {
    var generator: JsonGenerator
    try {
      generator = createJsonGenerator(httpServletResponse)
      _mapper.writeValue(generator, jsonRpcResponse)
    } catch (e: IOException) {
      throw new JsonRpcInternalErrorException(e){
          :Message = "Exception occurred while trying to write response"
          }
    } finally {
      if (generator != null) {
        generator.close()
      }
    }
  }

  private static function createJsonGenerator(resp: HttpServletResponse): JsonGenerator {
    resp.setContentType("application/json")
    resp.setCharacterEncoding("UTF-8")
    final var writer = new BufferedWriter(resp.Writer)
    return new JsonFactory().createGenerator(writer)
  }

}