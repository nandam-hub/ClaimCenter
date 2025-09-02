package edge.security.authorization

uses edge.jsonmapper.JsonProperty

class EdgeAuthorizationDTO {

  @JsonProperty
  var _entityID : String as EntityID

  @JsonProperty
  var _isAuthorized : Boolean as IsAuthorized

  public static function toDTO(entityID : String, isAuthorized : Boolean) : EdgeAuthorizationDTO {
    return new EdgeAuthorizationDTO() {
        :EntityID = entityID,
        :IsAuthorized = isAuthorized
    }
  }
}
