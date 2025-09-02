package edge.time

uses edge.aspects.validation.annotations.Range
uses edge.jsonmapper.JsonProperty

/**
 * A day time with the fixed time offset. Unlike ZonedTimeDTO, OffsetTimeDTO keeps a GMT offset only and does not
 * capture day-saving-time rules.
 */
class OffsetTimeDTO {
  /** Local time. */
  private var _time : LocalTimeDTO  as Time


  /** Offset (in minutes) between "local time at the capture location" and "local time in GMT time zone". */
  @JsonProperty
  @Range(-1440, 1440)
  private var _offset : int as Offset
}
