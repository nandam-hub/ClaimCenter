package edge.time

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/**
 * A "day time" in a specific time zone. Business hours (like hotline hours) could be represented using this class.
 */
class ZonedTimeDTO {
  /** Local time. */
  @JsonProperty
  @Required
  private var _time : LocalTimeDTO as Time

  /** Identifier of the time zone of this DTO. This could be either a timezone name like "Acre Time" or an 'offset zone'
   * like "GMT+02:23". Three-letter identifiers like 'PST' are supported but should not be used unless absolutely
   * required as these abbreviations may be ambiguous.
   */
  @JsonProperty
  @Required
  private var _zoneId : String as ZoneId

}
