package edge.time

uses edge.jsonmapper.JsonProperty
uses edge.aspects.validation.annotations.Required

/**
 * Class used to capture Date and Time (instant) along with the originating time zone. Unlike OffsetDateTimeDTO
 * storing the fixed offset from GMT, this class stores the TimeZone. The TimeZone defines an offset from GMT time and
 * the rules of that offset change over the time (the offset changes when Day-saving time is is effect).
 * The "Offset Zone ID" could be used in this class, then the DTO instance would be equivalent to the OffsetDateTimeDTO.
 */
class ZonedDateTimeDTO {
  /** Instant defined by this time. */
  @JsonProperty
  private var _instant : InstantDTO as Instant

  /** Identifier of the time zone of this DTO. This could be either a timezone name like "Acre Time" or an 'offset zone'
   * like "GMT+02:23". Three-letter identifiers like 'PST' are supported but should not be used unless absolutely
   * required as these abbreviations may be ambiguous.
   */
  @JsonProperty
  @Required
  private var _zoneId : String as ZoneId
}
