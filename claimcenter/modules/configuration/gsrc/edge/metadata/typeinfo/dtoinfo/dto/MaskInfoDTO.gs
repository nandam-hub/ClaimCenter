package edge.metadata.typeinfo.dtoinfo.dto

uses edge.jsonmapper.JsonProperty

class MaskInfoDTO {

  @JsonProperty
  private var _isMasked: Boolean as IsMasked

  @JsonProperty
  private var _pattern: String as Pattern
}
