package edge.time

uses java.util.TimeZone
uses java.util.Date
uses java.lang.StringBuilder
uses java.util.Calendar
uses java.lang.IllegalArgumentException

/**
 * Utilities for different operation on OffsetDateTimeDTO.
 */
class OffsetDateTimeUtil {
  /** Default time zone to be used. */
  private static final var DEFAULT_TIME_ZONE = TimeZone.getDefault()

  /**
   * Returns a calendar representing the calendar at the "time offset" at which the date was captured. This is not
   * the exact time zone like "Pacific Standard Time" but rather a fixed offset from the GMT time.
   * @param dto dto to convert to a calendar.
   * @returns calendar representing both date and time. Returns <code>null</code> if dto is <code>null</code>.
   */
  public static function toCalendar(dto : OffsetDateTimeDTO) : Calendar {
    if (dto == null) {
      return null
    }

    final var res = Calendar.getInstance(getOffsetTimeZone(dto))
    res.setTimeInMillis(dto.Offset)
    return res
  }

  /**
   * Converts the DTO into the instant (date). Note that the original time offset could not be represented in the
   * returned value.
   * @param dto dto to convert into the date. Could be <code>null</code>.
   * @returns a date representing the same instant as the dto or <code>null</code> iff dto is <code>null</code>.
   */
  public static function toDate(dto : OffsetDateTimeDTO) : Date {
    return dto == null ? null : InstantUtil.toDate(dto.Instant)
  }


  /**
   * Returns an offset (in minutes) between the time in the original location and time in GMT time zone.
   * @param dto dto to get the value from.
   * @returns a time offset at the origin of the dto. Returns <code>0</code> when dto is <code>null</code>.
   */
  public static function getOffsetMinutes(dto : OffsetDateTimeDTO) : int {
    return dto == null ? 0 : dto.Offset
  }

  /**
   * Returns a time zone representing the offest at the DTO location. Note that the time zone is an "offset" zone
   * with the fixed time difference between zoned and GMT time. It does not equal to the real time zone (like
   * Pacific Standard Time).
   * @param dto dto to extract the time zone from.
   * @returns time zone representing the fixed offset of the original location. Returns <code>null</code> when
   *   dto is <code>null</code>.
   */
  public static function getOffsetTimeZone(dto : OffsetDateTimeDTO) : TimeZone {
    if (dto == null) {
      return null
    }

    final var zoneIdBuilder = new StringBuilder("GMT")
    zoneIdBuilder.append(dto.Offset < 0 ? '-' : '+')

    final var absOffsetMinutes = dto.Offset < 0 ? -dto.Offset : dto.Offset
    final var hours = absOffsetMinutes / 60
    final var minutes = absOffsetMinutes % 60

    if (hours < 10) {
      zoneIdBuilder.append('0')
    }
    zoneIdBuilder.append(hours)
    zoneIdBuilder.append(':')

    if (minutes < 10) {
      zoneIdBuilder.append('0')
    }
    zoneIdBuilder.append(minutes)

    return TimeZone.getTimeZone(zoneIdBuilder.toString())
  }


  /**
   * Converts a local date/time into the offset date time capturing the original time/zone offset. Please note that
   * only the offset of the specific event is captured, not the whole time zone information. I.e. "-08:00" is captured
   * instead of "Pacific Standard Time".
   * @param cal calendar denoting local time to be converted.
   * @returns the offset DTO representing the instant at the offset of the cal's time zone. Returns <code>null</code>
   * if cal is <code>null</code>.
   */
  public static function fromCalendar(cal : Calendar) : OffsetDateTimeDTO {
    if (cal == null) {
      return null
    }

    final var timestamp = cal.TimeInMillis
    final var tz = cal.TimeZone

    final var res = new OffsetDateTimeDTO()
    res.Offset = tz.getOffset(timestamp)
    res.Instant = InstantUtil.toDto(cal)
    return res
  }



  /**
   * Converts a date into an offset date time capturing the offset from the specific time zone. Please note that
   * only the offset of the specific event is captured, not the whole time zone information. I.e. "-08:00" is captured
   * instead of "Pacific Standard Time".
   * @param date date to be converted. Could be <code>null</code>
   * @param timeZone time zone to capture the offset. May be <code>null</code> only when <code>date</code> is <code>null</code>.
   * @return the offset DTO representing the specified instant with the offset in the <code>timeZone</code> at the instant
   * described by the <code>date</code>. Returns <code>null</code> if date is <code>null</code>.
   * @throws IllegalArgumentException if <code>date</code> is not <code>null</code> but <code>timeZone</code> is.
   */
  public static function fromDateAtZone(date : Date, timeZone : TimeZone) : OffsetDateTimeDTO {
    if (date == null) {
      return null
    }

    if (timeZone == null) {
      throw new IllegalArgumentException("Time zone must be provided when date is not null")
    }

    final var timestamp = date.Time

    final var res = new OffsetDateTimeDTO()
    res.Offset = timeZone.getOffset(timestamp)
    res.Instant = InstantUtil.toDto(date)
    return res
  }


  /**
   * Creates a DTO representing instant with the offset at the default (java) time zone.
   * @param date date to be converted.
   * @returns the DTO representing the instant and offset in the default time zone at the instant of <code>date</code>.
   *   Returns <code>null</code> if date is <code>null</code>.
   */
  public static function fromDateAtDefaultZone(date : Date) : OffsetDateTimeDTO {
     return fromDateAtZone(date, DEFAULT_TIME_ZONE)
  }
}
