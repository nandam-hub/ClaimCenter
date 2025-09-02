package edge.el.dto

uses edge.jsonmapper.JsonProperty

/**
 * Expression mandating translation of the message using other display keys.
 */
final class TranslateDTO extends ExpressionDTO {

  /** Display key for the message. This display key must be static so frontend would be able to fetch proper values
   * for its translation.
   */
  @JsonProperty
  private var _displayKey : String as DisplayKey


  /** Positional arguments to the translation expression. */
  @JsonProperty
  private var _arguments : ExpressionDTO[] as Arguments

  construct(d : String, a : ExpressionDTO[]) {
    super("translate")
    this._displayKey = d
    this._arguments = a
  }
}
