package edge.servlet.jsonrpc

uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.core.JsonProcessingException
uses com.fasterxml.jackson.databind.DeserializationFeature
uses com.fasterxml.jackson.databind.JsonMappingException
uses com.fasterxml.jackson.databind.ObjectMapper
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.endpoint.IEndpointMethod
uses edge.jsonrpc.exception.JsonRpcException
uses edge.jsonrpc.exception.JsonRpcExceptionData
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses edge.jsonrpc.exception.JsonRpcMethodNotFoundException
uses edge.jsonrpc.exception.JsonRpcAuthenticationException
uses edge.jsonrpc.exception.JsonRpcParseException
uses edge.jsonrpc.exception.ParseErrorCause
uses edge.jackson.jsonrpc.support.JsonRpcRequest
uses edge.jackson.jsonrpc.support.JsonRpcDeserializer
uses edge.security.EffectiveUser
uses edge.servlet.jsonrpc.Observability.ObservabilityUtil
uses edge.servlet.jsonrpc.marshalling.GosuModule
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses edge.servlet.jsonrpc.protocol.JsonRpcResponse
uses edge.util.EdgeBasicAuthUtil
uses gw.api.observability.ObservabilityContext
uses gw.lang.reflect.TypeSystem
uses gw.plugin.Plugins
uses gw.plugin.observability.ObservabilityPlugin
uses java.lang.Class
uses java.lang.RuntimeException
uses java.lang.Throwable
uses java.util.Map
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse

/**
 * Processor for regular RPC calls. A regular call is a simple POST request to a specific URL.
 */
internal final class RegularJsonRpcCallProcessor implements IRequestProcessor {

  final private static var LOGGER = new Logger(Reflection.getRelativeName(RegularJsonRpcCallProcessor))
  private var _mapper: ObjectMapper

  /** Method map for this call processor. */
  private var methods : Map<String, IEndpointMethod>
  private var methodArgs: Map<String, Class<Object>[]>
  private var gosuMethodArgs: Map<String, String[]>
  private var verifyCaptcha: VerifyReCAPTCHA

  construct(meths : Map<String, IEndpointMethod>) {
    this.methods = meths
    this._mapper = new ObjectMapper()
    this._mapper.setTypeFactory(this._mapper.getTypeFactory().withClassLoader(RegularJsonRpcCallProcessor.Type.BackingClass.ClassLoader))
    this._mapper.registerModule(GosuModule.INSTANCE)
    this._mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
    this._mapper.disable(DeserializationFeature.READ_DATE_TIMESTAMPS_AS_NANOSECONDS)
    this._mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
    this.methodArgs = meths.mapValues( \ type -> type.getArgumentTypes().map( \ elt -> elt as Type as Class).toTypedArray())
    this.gosuMethodArgs = meths.mapValues( \ value -> value.getArgumentTypes().toTypedArray().map( \ elt -> elt.Name))
    this.verifyCaptcha = new VerifyReCAPTCHA()
  }

  override function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse) {
    var jsonRequest: JsonRpcRequest

    try {
      jsonRequest = JsonRpcDeserializer.deserialize(this._mapper, req.Reader, methodArgs, gosuMethodArgs)
      LOGGER.addRequestId(jsonRequest.Id)

      final var meth = methods.get(jsonRequest.Method)
      if (meth == null) {
        throw new JsonRpcMethodNotFoundException() {:Message = "Illegal method name " + jsonRequest.Method}
      }

      final var hasBasicAuth = EdgeBasicAuthUtil.hasBasicAuth(req)

      if (hasBasicAuth && !EdgeBasicAuthUtil.isBasicAuthAllowed(jsonRequest.Method, user.Token)) {
        throw new JsonRpcAuthenticationException() {:Message = "Unauthorised operation."}
      }
      checkCaptcha(meth.getMethodInfo(), req, this.verifyCaptcha)

      var methodParameters = transformTypekeyArgs(jsonRequest)
      final var result = meth.call(user, methodParameters)
      JsonRpcResponder.setSuccessfulResponse(resp, new JsonRpcResponse(result, jsonRequest.Id))
    } catch(e : JsonRpcException) {
      LOGGER.logError(e)
      observeError(e)
      JsonRpcResponder.setObfuscatedErrorResponse(resp, e, jsonRequest.Id)
    } catch(t: JsonMappingException) {
      LOGGER.logError(t)
      observeError(t)
      JsonRpcResponder.setObfuscatedErrorResponse(resp, new JsonRpcParseException(t), jsonRequest.Id)
    } catch (m : JsonProcessingException) {
      LOGGER.logError(m)
      observeError(m)
      JsonRpcResponder.setObfuscatedErrorResponse(resp, new JsonRpcInvalidParamsException(m), jsonRequest.Id)
    } catch (t : Throwable) {
      observeError(t)
      LOGGER.logError(t)
      throw t
    } finally {
      LOGGER.resetInfo()
    }
  }

  /**
   * If the deserializer sees typekeys as arguments to a function it returns a result of '$typekey:$typecode'
   * as it does not have enough information to be able to deserialize it (and does not have access to the type system).
   * This function finds and replace those results with actual typecodes.
   */
  private static function transformTypekeyArgs(jsonRequest : JsonRpcRequest) : List<Object> {
    var requestParameters = jsonRequest.Params.copy()
    for (var parameter in requestParameters index i){
      if (typeof parameter == String && (parameter as String).startsWith("typekey.")){
        var typekeyAndTypecode = (parameter as String).split('::') // as set by JsonRpcDeserializer
        var t = TypeSystem.getByFullNameIfValid(typekeyAndTypecode[0])
        if ( t typeis gw.entity.ITypeList ) {
          var typecode = t.getTypeKey(typekeyAndTypecode[1])
          requestParameters.set(i, typecode)
        } else {
          throw new RuntimeException("Unsupported typelist class "+ t)
        }
      }
    }

    return requestParameters
  }

  private static function createExceptionData(error: ParseErrorCause, jsonString: String): JsonRpcExceptionData{
    return JsonRpcExceptionData.newExceptionData({
        "parse error" -> error,
        "unparsable string" -> jsonString
    })
  }

  private static function createExceptionData(error: ParseErrorCause): JsonRpcExceptionData{
    return JsonRpcExceptionData.newExceptionData({
        "parse error" -> error,
        "unparsable string" ->""
    })
  }

  private function observeError(exception: Throwable) {
    if (ObservabilityUtil.isObservabilityEnabled()) {
      Plugins.get(ObservabilityPlugin).onProcessError(ObservabilityUtil.getMarkerName(), exception, new ObservabilityContext())
    }
  }
}