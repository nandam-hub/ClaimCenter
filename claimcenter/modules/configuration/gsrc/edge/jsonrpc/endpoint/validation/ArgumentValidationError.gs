package edge.jsonrpc.endpoint.validation

uses edge.jsonmapper.JsonProperty

/** Representation of the argument validation error. */
final class ArgumentValidationError {
  /** Name of the argument (used for debugging purposes). */
  @JsonProperty
  private var _argumentName : String as ArgumentName

  /** Path to the invalid property. */
  @JsonProperty
  private var _path : String as Path

  /** Validation message for the arguments. */
  @JsonProperty
  private var _message : String as Message

  internal construct(n : String, p : String, m : String) {
    this._argumentName = n
    this._path = p
    this._message = m
  }
}
