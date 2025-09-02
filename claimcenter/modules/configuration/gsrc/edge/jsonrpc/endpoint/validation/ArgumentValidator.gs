package edge.jsonrpc.endpoint.validation

uses edge.aspects.validation.context.ContextAspect

/** Validator for the arguments. */
abstract class ArgumentValidator {
  internal construct() {}


  /** Validates an object. */
  abstract function validate(ctx : ContextAspect, value : Object) : List<ArgumentValidationError>
}
