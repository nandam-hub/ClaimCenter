package edge.time

uses java.util.Date
uses java.util.TimeZone
uses java.util.Calendar
uses java.lang.IllegalArgumentException

/**
 * Utilities for the InstantDTO.
 */
class InstantUtil {
  /** Default time zone to be used. */
  private static final var DEFAULT_TIME_ZONE = TimeZone.getDefault()


  /**
   * Converts an instant dto to an instant represented as a Java Date.
   * @param dto dto to covert.
   * @returns a date representing the same instant as a dto. Returns <code>null</code> if dto is <code>null</code>.
   */
  static function toDate(dto : InstantDTO) : Date {
    if (dto == null) {
      return null
    }

    return new Date(dto.Time)
  }

  /**
   * Converts a DTO into an instance of the calendar in the specific time zone.
   * @param dto dto to convert.
   * @param timeZone target time zone.
   * @returns a calendar representing the dto's instant in the timeZone zone. Returns <code>null</code> if dto is
   * <code>null</code>.
   * @throws java.lang.IllegalArgumentException if timeZone is <code>null</code> and dto is not.
   */
  static function toCalendar(dto : InstantDTO, timeZone : TimeZone) : Calendar {
    if (dto == null) {
      return null
    }

    if (timeZone == null) {
      throw new IllegalArgumentException("Time zone could not be null if dto is not null")
    }

    final var res = Calendar.getInstance(timeZone)
    res.setTimeInMillis(dto.Time)
    return res
  }



  /**
   * Converts an instant into the calendar in the Java default time zone.
   * @param dto dto to convert.
   * @returns a calendar representing the instant in the default time zone. Returns <code>null</code> if dto is
   * <code>null</code>.
   */
  static function toCalendar(dto : InstantDTO) : Calendar {
    return toCalendar(dto, DEFAULT_TIME_ZONE)
  }



  /**
   * Converts an instant represented by date into the instant DTO.
   * @param date date to convert into an instant.
   * @returns a dto representing the same instant as the date. Returns <code>null</code> if date is <code>null</code>.
   */
  static function toDto(date : Date) : InstantDTO {
    if (date == null) {
      return null
    }

    final var dto = new InstantDTO()
    dto.Time = date.Time
    return dto
  }



  /**
   * Converts an instant represented by the calendar into the instant DTO. Timezone information could not be saved by
   * this conversion. Use ZonedDateTimeDTO or OffsetDateTimeDTO if you need it.
   * @param cal calendar to extract an instant.
   * @returns a dto representing the same instant as the cal. Returns <code>null</code> if cal is <code>null</code>.
   */
  static function toDto(cal : Calendar) : InstantDTO {
    if (cal == null) {
      return null
    }

    final var res = new InstantDTO()
    res.Time = cal.TimeInMillis
    return res
  }
}
