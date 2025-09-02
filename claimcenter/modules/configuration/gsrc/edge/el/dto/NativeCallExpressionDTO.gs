package edge.el.dto

uses edge.jsonmapper.JsonProperty

/**
 * Definition of the "native function call" expression.
 */
class NativeCallExpressionDTO extends ExpressionDTO {
  /** Container (object, namespace) defining the function. It could be either a class name (when accessing a
   * static function of the class) or some system namespace (like ":sys:").
   */
  @JsonProperty
  private var _container : String as readonly Container

  /**
   * Name of the function to call.
   */
  @JsonProperty
  private var _name : String as readonly Name

  /**
   * Expressions defining values to be passed into the function.
   */
  @JsonProperty
  private var _params : ExpressionDTO[] as Params

  construct(cont : String, nm : String, pms : ExpressionDTO[]) {
    super("nativecall")
    this._container = cont
    this._name = nm
    this._params = pms
  }
}
