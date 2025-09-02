package edge.capabilities.claim.activity.dto

uses edge.jsonmapper.JsonProperty

class ActivitySearchDTO {
  @JsonProperty
  var _statuses : ActivityStatus[] as Statuses

}
