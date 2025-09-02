package edge.aspects.validation.dto

uses gw.entity.TypeKey
uses edge.jsonmapper.JsonProperty

/**
 * DTO for the typekey list.
 */
final class TypekeyListFilterDTO {
  @JsonProperty
  private var _codes : TypeKey[] as Codes

  construct(c : TypeKey[]) {
    this._codes = c
  }
}
