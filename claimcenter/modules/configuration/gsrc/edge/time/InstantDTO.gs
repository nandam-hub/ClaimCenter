package edge.time

uses edge.jsonmapper.JsonProperty
/**
 * The dto describing a specific unique moment of the time. This moment is "universal" (machine) time across all the
 * planet. The specific instant have different "representation" in different time zones.
 */
class InstantDTO {
  /** Amount of millis passed since 00:00:00.000 1 Jan 1970 GMT. */
  @JsonProperty
  private var _time : long as Time
}
