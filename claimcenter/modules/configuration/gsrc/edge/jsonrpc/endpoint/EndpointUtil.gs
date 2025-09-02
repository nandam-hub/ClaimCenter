package edge.jsonrpc.endpoint

uses edge.PlatformSupport.Reflection
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.jsonrpc.endpoint.validation.ArgumentValidator
uses edge.jsonrpc.endpoint.validation.ArgumentValidatorFactory
uses java.util.Arrays
uses edge.util.MapUtil
uses edge.util.either.Either
uses gw.lang.reflect.IMethodInfo
uses gw.lang.reflect.IParameterInfo
uses java.lang.Iterable
uses java.lang.IllegalArgumentException

/**
 * <strong>Access point for endpoint manipulations</strong>. Contains utilities, factories and convenience methods.
 */
final class EndpointUtil {


  /**
   * Creates an endpoint handler for the given RPC object. This method automatically generate metadata handlers and
   * installs basic authority checks for all eligible methods.
   */
  @Param("obj", "RPC object instance, could not be <code>null</code>")
  public static function endpointForObject(obj : IRpcHandler) : Either<List<String>,RpcEndpoint> {
    if (obj == null) {
      throw new IllegalArgumentException("RPC object could not be null")
    }

    final var objectType = typeof obj
    final var rpcMethods = getRPCMethodsForHandler(obj)
    final var methMap = MapUtil.groupCollection(rpcMethods, \meth -> meth.DisplayName, \meth -> meth)

    final var dupes = methMap.entrySet()
        .where( \ elt -> elt.Value.size() > 1)
        .map(\elt -> objectType.QName + " have overloaded RPC method " +  elt.Key)

    if (!dupes.Empty) {
      return Either.left<List<String>, RpcEndpoint>(dupes)
    }

    final var handlerMap = methMap.mapValues( \ value -> handlerForMethod(obj, value.get(0)))
    return Either.right<List<String>,RpcEndpoint>(new RpcEndpoint(handlerMap))
  }

  @Param("handler", "The handler in question.")
  @Returns("The metadata associated with the given handler.")
  public static function generateMetadataForHandler(handler: IRpcHandler): Object {
    var rpcMethods = getRPCMethodsForHandler(handler)
    var metadataMethod = generateMetadataMethod(rpcMethods) as MetadataMethod
    return metadataMethod.invoke(null)
  }

  /**
   * Automatically generates metadata handler assuming that only <code>originalMethods</code> are exposed as RPC
   * methods. Metadata generation algorithm is described in documentation for {@link IRpcHandler}.
   * <p>Returned method is <strong>unauthenticated</strong> method.</p>
   *
   * @see IRpcHandler
   */
  @Param("rpcMethods", "Exposed RPC methods. These method have to belong to the same time, however, this condiniton is not checked.")
  @Returns("Automatic metadata method as described in IRpcHandler documentation.")
  private static function generateMetadataMethod(rpcMethods: Iterable<IMethodInfo>) : IEndpointMethod {
    return MetadataMethod.create(rpcMethods)
  }

  private static function getRPCMethodsForHandler(handler: IRpcHandler): List<IMethodInfo> {
    final var objectType = typeof handler
    return objectType.TypeInfo.Methods.where(\meth -> isRpcMethod(meth))
  }

  /**
   * Creates invocation handler for the specific method on the specific object. Handles authentication annotation and
   * adds authentication checks as needed.
   */
  @Param("instance", "Instance to call method on. Cannot be <code>null</code>")
  @Param("method", "Method to call on the instance. Cannot be <code>null</code> and must be a method on instance's type.")
  private static function handlerForMethod(instance : Object, method : IMethodInfo) : IEndpointMethod {
    final var validators = Arrays.asList(method.Parameters.map( \ elt -> createValidator(elt)))
    var res : IEndpointMethod = new RpcMethod(instance, method, validators)

    if(requiresInternalGWUser(method)){
      res = new InternalGWUserMethod(res)
    }else if (requiresAuthentication(method)) {
      res = new AuthenticatedMethod(res)
    }

    return res
  }

  /**
   * Creates a validator for the parameter.
   */
  @Param("param", "Parameter to create a validator for")
  private static function createValidator(param : IParameterInfo) : ArgumentValidator {
    return ArgumentValidatorFactory.INSTANCE.createValidator(param)
  }


  /**
   * Checks if rpc method could be an RPC method.
   */
  private static function isRpcMethod(meth : IMethodInfo) : Boolean {
    return meth.Public && (Reflection.hasAnnotation(meth, JsonRpcMethod) || Reflection.hasAnnotation(meth, JsonRpcUnauthenticatedMethod))
  }


  /**
   * Checks if a method requires an authentication according to its annotations.
   */
  private static function requiresAuthentication(meth : IMethodInfo) : Boolean {
    return !Reflection.hasAnnotation(meth, JsonRpcUnauthenticatedMethod)
  }

  /**
   * Checks if a method should be run as an internal gw user
   */
  private static function requiresInternalGWUser(meth : IMethodInfo) : Boolean {
    return Reflection.hasAnnotation(meth, JsonRpcRunAsInternalGWUser)
  }
}
