package edge.aspects.validation.dto

uses edge.jsonmapper.JsonProperty
uses edge.el.dto.ExpressionDTO

class ContextDTO {

  @JsonProperty
  private var _name : String as Name

  @JsonProperty
  private var _expr : ExpressionDTO as Expression

}
