package edge.uaaoperations.dto

uses edge.jsonmapper.JsonProperty

class ScimGroupMemberDTO {

  @JsonProperty()
  private var value: String as Value

  @JsonProperty()
  private var origin: String as Origin

  @JsonProperty()
  private var type:ScimGroupMemberDTO.Type as Type

  construct() {
    this.origin = "uaa"
  }

  construct(_memberId: String) {
    this(_memberId, Type.USER)
  }

  construct (_memberId: String, _type: ScimGroupMemberDTO.Type) {
    this.origin = "uaa"
    this.value = _memberId
    this.type = _type
  }

  static enum Type {
    USER,
    GROUP
    private construct() {}
  }

  override function hashCode(): int {
    var prime = 31
    var result = 1
    result = prime * result + ((value == null) ? 0 : value.hashCode())
    result = prime * result + ((type == null) ? 0 : type.hashCode())
    return result
  }

  override function equals(obj: Object): boolean {
    if (this === obj) {
      return true
    }
    if (obj == null) {
      return false
    }
    if (obj typeis ScimGroupMemberDTO) {
      if (value != obj.Value) {
        return false
      }
      if (type != obj.Type) {
        return false
      }
      return true

    } else {
      return false
    }
  }

  override function toString(): String {
    return "(memberid: ${value}, type: ${type})"
  }
}
