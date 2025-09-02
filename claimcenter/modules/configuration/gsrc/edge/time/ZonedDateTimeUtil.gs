package edge.time

uses java.util.Date
uses java.util.TimeZone
uses java.util.Calendar
uses java.lang.IllegalArgumentException

/**
 * Utilities for operations on the OffsetDateTime.
 * <p><strong>Warning</strong> conversion of the DTO's time zone into the TimeZone instance defaults all unknown
 * zone IDs to GMT. This may cause a loss of data when unexpected zone ID was received. However, there is no robust
 * Java API to prevent this.</p>
 */
class ZonedDateTimeUtil {
  /** Default time zone to be used. */
  private static final var DEFAULT_TIME_ZONE = TimeZone.getDefault()


  /**
   * Converts the dto into an instance of the calendar capturing both an instant and the time zone.
   * <strong>Warning</strong> this method returns GMT time zone if zone id was not understood. This could cause the
   * @param dto dto to convert.
   * @returns a calendar representing the instant and time zone of the DTO. Returns <code>null</code>
   * if dto is <code>null</code>.
   */
  function toCalendar(dto : ZonedDateTimeDTO) : Calendar {
    if (dto == null) {
      return null
    }

    return InstantUtil.toCalendar(dto.Instant, TimeZone.getTimeZone(dto.ZoneId));
  }


  /**
   * Retrieves an instant (moment of time) from the zoned date time.
   * @param dto dto to extract data from.
   * @returns date representing an instant of the DTO. Returns <code>null</code> if the dto is <code>null</code>.
   */
  function toDate(dto : ZonedDateTimeDTO) : Date {
    return dto == null ? null : InstantUtil.toDate(dto.Instant)
  }


  /**
   * Returns a time zone instance for the time zone of the <code>dto</code>.
   * <strong>Warning</strong> this method returns GMT time zone if zone id was not understood. This could cause the
   * data loss without any warnings. However, there is no safe API for the TimeZone handling.
   * @param dto dto to get a time zone for.
   * @returns a time zone for the time zone of the DTO. Returns <code>null</code> if the dto is <code>null</code>.
   * Returns a GMT time zone if the zone ID is not understood.
   */
  function getZone(dto : ZonedDateTimeDTO) : TimeZone {
    return dto == null ? null : TimeZone.getTimeZone(dto.ZoneId)
  }


  /**
   * Creates a new Zoned Date Time representing the calendar instance.
   * @param cal calendar to convert into a DTO.
   * @returns a DTO representing the same instant and timezone as <code>cal</code>. Returns <code>null</code>
   * if cal is <code>null</code>.
   */
  function fromCalendar(cal : Calendar) : ZonedDateTimeDTO {
    if (cal == null) {
      return null
    }

    final var res = new ZonedDateTimeDTO()
    res.Instant = InstantUtil.toDto(cal)
    res.ZoneId = cal.TimeZone.ID
    return res
  }


  /**
   * Creates a new instance of the zoned date time DTO capturing the instant represented by <code>date</code> and
   * time zone provided by <code>zone</code>.
   * @param date date to be converted. Could be <code>null</code>
   * @param timeZone time zone. May be <code>null</code> only when <code>date</code> is <code>null</code>.
   * @return a DTO representing the specified instant with the specific time zone.
   * Returns <code>null</code> if date is <code>null</code>.
   * @throws IllegalArgumentException if <code>date</code> is not <code>null</code> but <code>timeZone</code> is.
   */
  function fromDateAndZone(date : Date, timeZone : TimeZone) : ZonedDateTimeDTO {
    if (date == null) {
      return null
    }

    if (timeZone == null) {
      throw new IllegalArgumentException("Time zone must be provided when date is not null")
    }

    final var res = new ZonedDateTimeDTO()
    res.Instant = InstantUtil.toDto(date)
    res.ZoneId = timeZone.ID
    return res
  }

  /**
   * Creates a new instance of the zoned date time DTO capturing a passed instant and the default Java time zone.
   * @param date date to be converted.
   * @returns a zoned dote time DTO representing the date's instant and the default Java time zone.
   * Returns <code>null</code> if date is <code>null</code>.
   */
  function fromDateAtDefaultZone(date : Date) : ZonedDateTimeDTO {
    return fromDateAndZone(date, DEFAULT_TIME_ZONE)
  }
}
