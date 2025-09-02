package edge.jsonrpc.endpoint

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.exception.DtoValidationException
uses java.lang.reflect.InvocationTargetException
uses java.lang.IllegalArgumentException

uses edge.jsonrpc.exception.JsonRpcApplicationException
uses edge.jsonrpc.exception.JsonRpcException
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses edge.jsonrpc.exception.JsonRpcSecurityException
uses edge.security.authorization.exception.AuthorizationException
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses edge.exception.ApplicationException
uses java.lang.Exception
uses edge.security.EffectiveUser
uses edge.uaaoperations.uaaclient.UaaConnectionException

internal abstract class InvokableMethod implements IEndpointMethod {
  final private static var LOGGER = new Logger(Reflection.getRelativeName(InvokableMethod))

  final override function call(user : EffectiveUser, args: List<Object>) : Object {
    try {
      return invoke(args)
    } catch(e: JsonRpcException){
      LOGGER.logError(e.Message, e)
      throw e
    }
    catch(e: DtoValidationException){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcInvalidParamsException(e)
    }
    catch(e : InvocationTargetException){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcInternalErrorException(e){:Message = e.Message }
    }    
    catch(e : IllegalArgumentException){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcInvalidParamsException(){ :Message = e.Message == null ? "Invalid Params" : e.Message }
    }
    catch(e : AuthorizationException){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcSecurityException(e)
    } catch (e : UaaConnectionException){
      throw new JsonRpcInvalidParamsException(){ :Message = e.Message}
    }
    /* general exceptions thrown from 'the application layer', specific application exceptions
      must exptend the ApplicationException in order to be caught here and handled consistently */
    catch(e: ApplicationException){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcApplicationException(e)
    }
    // a 'catch-all' block, that doesn't let exceptions fall threw the cracks (but it would allow errors to go through)
    catch(e : Exception){
      LOGGER.logError(e.Message, e)
      throw new JsonRpcInternalErrorException(e){:Message = e.Message}
    }
  }
  
  /** 
   * Invokes a method on the object.
   */
  internal abstract function invoke(args : List<Object>) : Object
}
