package edge.time

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Range

/**
 * DTO representing a specific moment in time with the time offset in the originating location.
 * <p>This DTO captures an offset only, not the time zone. Time zone may have day-saving time so it may have different
 * offsets during a year. Javascript does not provide us with that information.
 *
 * <p>Users of this class should avoid direct access to the fields and use offsetDateTimeUtil as much as possible.
 * The internal representation of this class may change.</p>
 */
class OffsetDateTimeDTO {
  /** Instant described by this date/time. */
  @JsonProperty
  private var _instant : InstantDTO as Instant

  /** Offset (in minutes) between "local time at the capture location" and "local time in GMT time zone". */
  @JsonProperty
  @Range(-1440, 1440)
  private var _offset : int as Offset
}
