package edge.aspects.validation.dto

uses edge.jsonmapper.JsonProperty
uses edge.el.dto.ExpressionDTO


/** Checks that typekey belongs to a specific filter. */
final class TypelistFilterDTO {
  /** Name of the filter to use on the typelist. */
  @JsonProperty
  private var _filterName : String as FilterName
  construct(fn : String) {
    this._filterName = fn
  }
}
