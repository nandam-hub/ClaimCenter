package edge.servlet.jsonrpc

uses edge.servlet.security.IHttpRequestUserIdentityPlugin
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.jsonrpc.endpoint.RpcEndpoint
uses jakarta.servlet.http.HttpServletRequest
uses jakarta.servlet.http.HttpServletResponse
uses edge.security.EffectiveUserProvider
uses org.apache.commons.fileupload2.jakarta.JakartaServletFileUpload
uses edge.util.mapping.EntityCreationContextProvider
uses edge.jsonrpc.endpoint.IEndpointMethod
uses edge.servlet.jsonrpc.IRequestProcessor
uses java.util.HashMap
uses org.apache.commons.fileupload2.core.FileItem
uses edge.PlatformSupport.Bundle

/**
 * Processor for one Json-RPC URL. Handles all requests addressed to the same object.
 */
final class JsonRpcEndpointProcessor {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(JsonRpcEndpointProcessor))

  private var _authorizer : IHttpRequestUserIdentityPlugin

  private var _singlepartProcessor : IRequestProcessor
  private var _multipartProcessor : IRequestProcessor

  construct(authorizer : IHttpRequestUserIdentityPlugin, rpcEndpoint : RpcEndpoint) {
    this._authorizer = authorizer

    final var multipartMethod = getMultipartMethod(rpcEndpoint)

    final var trueRpcMethods = new HashMap<String, IEndpointMethod>(rpcEndpoint.getMethodMap())
    if (multipartMethod != null)  {
      trueRpcMethods.remove("upload")
    }

    this._singlepartProcessor = new RegularJsonRpcCallProcessor(trueRpcMethods)
    this._multipartProcessor =
        multipartMethod == null ?
            BadRequestHandler.BAD_MULTIPART_REQUEST :
            new MultipartJsonRpcCallProcessor(multipartMethod)
  }


  public function handleCall(req : HttpServletRequest, resp: HttpServletResponse) {
    try{
      Bundle.transaction(\ bundle -> {
        var effectiveUser = _authorizer.getEffectiveUserFromRequest(req)
        EffectiveUserProvider.User = effectiveUser

        final var isMultipart = JakartaServletFileUpload.isMultipartContent(req)
        if (isMultipart) {
          _multipartProcessor.process(effectiveUser, req, resp)
        } else {
          _singlepartProcessor.process(effectiveUser, req, resp)
        }
      })

    } finally {
      EntityCreationContextProvider.clear()
      EffectiveUserProvider.User = null
    }
  }

  /** Returns a multipart hanlder for this endpoint. */
  private function getMultipartMethod(ep : RpcEndpoint) : IEndpointMethod {
    final var guess = ep.getMethodMap().get("upload")
    return guess != null && isUploadMethod(guess) ? guess : null
  }


  internal static function isUploadMethod(meth : IEndpointMethod) : boolean {
    final var argTypes = meth.getArgumentTypes()
    if (argTypes.size() != 2) {
      return false
    }

    return (argTypes.get(1) == FileItem)
  }
}