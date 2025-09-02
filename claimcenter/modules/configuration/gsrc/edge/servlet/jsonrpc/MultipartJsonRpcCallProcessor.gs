package edge.servlet.jsonrpc

uses com.fasterxml.jackson.databind.ObjectMapper
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.endpoint.IEndpointMethod
uses edge.jsonrpc.exception.JsonRpcException
uses edge.metadata.service.DefaultMetadataService
uses edge.security.EffectiveUser
uses edge.servlet.jsonrpc.marshalling.GosuModule
uses edge.servlet.jsonrpc.protocol.JsonRpcResponder
uses edge.servlet.jsonrpc.protocol.JsonRpcResponse
uses gw.lang.reflect.IPropertyAccessor
uses org.apache.commons.fileupload2.core.DiskFileItemFactory
uses org.apache.commons.fileupload2.jakarta.JakartaServletDiskFileUpload
uses org.apache.commons.fileupload2.core.FileItem
uses com.fasterxml.jackson.databind.DeserializationFeature
uses edge.servlet.jsonrpc.VerifyReCAPTCHA

uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses java.io.IOException
uses java.lang.Class
uses java.util.Arrays

/**
 * Processor for the multipart Json-Rpc requests.
 */
internal final class MultipartJsonRpcCallProcessor implements IRequestProcessor {


  final private static var LOGGER = new Logger(Reflection.getRelativeName(MultipartJsonRpcCallProcessor))

  /** Endpoint for the RPC to call. */
  private var peer : IEndpointMethod

  private var _mapper: ObjectMapper

  /** Accessor for the content type on the first argument. */
  private var contentTypeAccessor : IPropertyAccessor
  private var verifyCaptcha: VerifyReCAPTCHA

  construct(p : IEndpointMethod) {
    this.peer = p
    final var firstArgType = p.getArgumentTypes().get(0)
    this.contentTypeAccessor = DefaultMetadataService.SERVICE.getExposedProperties(firstArgType)
        .firstWhere( \ elt -> elt.Name == 'MimeType')?.Accessor
    this._mapper = new ObjectMapper()
    this._mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
    this._mapper.registerModule(GosuModule.INSTANCE)
    this.verifyCaptcha = new VerifyReCAPTCHA()
  }

  override function process(user : EffectiveUser, req : HttpServletRequest, resp :  HttpServletResponse) {
    final var params = parseMethodArgs(req)

    checkCaptcha(peer.getMethodInfo(), req, verifyCaptcha)

    try{
      final var result = peer.call(user, Arrays.asList(params))
      JsonRpcResponder.setSuccessfulResponse(resp, new JsonRpcResponse(result, "1.0"))
    } catch(e : JsonRpcException) {
      LOGGER.logError(e)
      JsonRpcResponder.setErrorResponse(resp, e, "1.0")
    }
  }

  private function parseMethodArgs(req : HttpServletRequest) : Object[] {
    // Multipart content detected, parsing first part as the JSON payload
    final var defaultFileItemFactory = DiskFileItemFactory.builder().get()
    final var diskFileUpload = new JakartaServletDiskFileUpload(defaultFileItemFactory)
    final var files = diskFileUpload.parseRequest(req) as List<FileItem>

    if (files.Count < 2) {
      throw new IOException("Do not know what to do with the single multipart file")
    }

    final var file = files.get(1)

    final var metaString = files.get(0).getString(java.nio.charset.StandardCharsets.UTF_8)
    final var metadata = _mapper.readValue(metaString,peer.getArgumentTypes().get(0) as Type as Class)
    if (contentTypeAccessor != null && contentTypeAccessor.getValue(metadata) == null) {
      contentTypeAccessor.setValue(metadata, file.ContentType)
    }

    return { metadata, file }
  }
}