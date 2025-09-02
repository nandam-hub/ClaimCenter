package edge.metadata.typeinfo.type.dto

uses edge.jsonmapper.JsonProperty

/**
 * DTO passing information about one type.
 */
abstract class TypeDTO {
  @JsonProperty
  private var _kind : String as readonly Kind

  internal construct(k : String) {
    this._kind = k
  }
}
