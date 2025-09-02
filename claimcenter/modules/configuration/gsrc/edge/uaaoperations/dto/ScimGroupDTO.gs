package edge.uaaoperations.dto

uses edge.jsonmapper.JsonProperty

class ScimGroupDTO extends ScimBase {

  construct() {}

  construct(_name: String) {
    this.displayName = _name
  }

  construct(_id: String, _name: String) {
    super(_id)
    this.displayName = _name
  }

  @JsonProperty
  private var displayName: String as DisplayName

  @JsonProperty
  private var description: String as Description

  @JsonProperty
  private var members: List<ScimGroupMemberDTO> as Members

}
