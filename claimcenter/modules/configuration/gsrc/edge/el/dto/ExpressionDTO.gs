package edge.el.dto

uses edge.jsonmapper.JsonProperty

/** Abstract definition of the expression. */
abstract class ExpressionDTO {

  /** Expression kind (aka constant, function application, etc...). */
  @JsonProperty
  private var _kind : String as readonly Kind


  /** Creates a new expression DTO and initializes its kind. */
  internal construct(ekind : String) {
    this._kind = ekind
  }

}
