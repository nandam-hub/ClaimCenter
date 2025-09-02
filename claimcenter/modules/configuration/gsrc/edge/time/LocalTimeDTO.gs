package edge.time

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Range

/**
 * A DTO representing a time in some location.
 */
class LocalTimeDTO {
  /** Hour of the day. */
  @JsonProperty
  @Range(0, 23)
  private var _hour : int as Hour

  /** Minute of the hour. */
  @JsonProperty
  @Range(0, 59)
  private var _minute : int as Minute


  /** Second of the minute. */
  @JsonProperty
  @Range(0, 59)
  private var _second : int as Second


  /** Millisecond in the second. */
  @JsonProperty
  @Range(0, 999)
  private var _millis : int as Millisecond
}
