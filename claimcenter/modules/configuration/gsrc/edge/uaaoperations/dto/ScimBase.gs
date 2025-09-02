package edge.uaaoperations.dto

uses edge.jsonmapper.JsonProperty
uses java.lang.Integer

class ScimBase {

  @JsonProperty
  private var id : String as Id

  @JsonProperty
  private var externalId: String as ExternalId

  @JsonProperty
  private var schemas: String[] as Schemas = {"urn:scim:schemas:core:1.0"}

  construct() {}

  construct(_id: String) {
    this.id = _id
  }

  override function hashCode(): int {
    return id != null ? id.hashCode() : Object.Type.hashCode()
  }

  override function equals(obj: Object): boolean {
    if (obj typeis ScimBase) {
      var other = obj as ScimBase
      return id == other.Id
    } else if (obj typeis String) {
      var otherId = 0 as String
      return id == otherId
    }
    return false
  }
}
