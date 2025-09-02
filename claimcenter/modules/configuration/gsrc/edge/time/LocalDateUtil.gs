package edge.time

uses java.text.SimpleDateFormat
uses java.util.Date
uses java.util.TimeZone
uses java.util.Calendar
uses java.util.GregorianCalendar

/**
 * Utilities for operations on the Local Dates (local Date DTO conversions, validations, etc...).
 *
 * <p>This class have Util suffix to avoid ambiguous imports when used in conjunction with java.time.LocalDate.
 */
class LocalDateUtil {
  /** Default time zone used by the server/platform. */
  private static final var DEFAULT_TIME_ZONE = TimeZone.getDefault();

  /**
   * Converts a time moment into the local (calendar) date of the moment's time zone.
   * @param cal calendar instance denoting local (zoned or offset) date and time. Can be <code>null</code>.
   * @return instance of the local date representing cal's date in the cal's time zone. Returns <code>null</code>
   *   when the <code>cal</code> is <code>null</code>.
   */
  public static function toDTO(cal : Calendar) : LocalDateDTO {
    if (cal == null) {
      return null
    }

    final var res = new LocalDateDTO()
    res.Year = cal.get(Calendar.YEAR)
    res.Month = cal.get(Calendar.MONTH)
    res.Day = cal.get(Calendar.DAY_OF_MONTH)
    return res
  }


  /**
   * Converts java date (instant) into the local date as it was at the specific time zone.
   * <p>As java date represents an instant, timezone is required to convert it into a local time. The same instant could
   * represent different local days in different time zones.
   * <p>Java LocalDate should be used where possible to represent local dates, not this class.
   *
   * @param dt date to convert into the local date. Can be <code>null</code>.
   * @param tz timezone in which the local date is represented.
   * @return local date inside the <code>tz</code> containing the <code>dt</code> instant. Returns <code>null</code> if
   *   <code>dt</code> is <code>null</code>.
   */
  public static function toDTO(dt : Date, tz : TimeZone) : LocalDateDTO {
    if (dt == null) {
      return null
    }

    final var cal = new GregorianCalendar(tz)
    cal.setTime(dt)
    return toDTO(cal)
  }


  /**
   * Converts a date into the local (calendar) date in the default time zone. Default time zone is determined according
   * to Java platform rules.
   * @param dt date to convert into the local date. Can be <code>null</code>.
   * @return local date inside the default time zone containing the <code>dt</code> instant. Returns <code>null</code>
   *   if <code>dt</code> is <code>null</code>.
   */
  public static function toDTO(dt : Date) : LocalDateDTO {
    return toDTO(dt, DEFAULT_TIME_ZONE)
  }


  /**
   * Converts a local (calendar) date into an instant representing day start in the specific time zone.
   * @param dto local (calendar) date. Can be <code>null</code>.
   * @param tz timezone in which a day start should be recorded.
   * @return a start of the <code>dto</code> day in the <code>tz</code> timezone. Returns <code>null</code> if the
   *   <code>dto</code> is <code>null</code>.
   */
  public static function toMidnightDate(dto : LocalDateDTO, tz : TimeZone) : Date {
    if (dto == null) {
      return null
    }

    final var cal = new GregorianCalendar(tz)
    cal.clear()
    cal.set(Calendar.YEAR, dto.Year)
    cal.set(Calendar.MONTH, dto.Month)
    cal.set(Calendar.DAY_OF_MONTH, dto.Day)
    return cal.Time
  }


  /**
   * Converts a local (calendar) date into an instant representing day start in the default time zone. Default time zone
   * is determined according to Java platform rules.
   * @param dto local (calendar) date. Can be <code>null</code>.
   * @return a start of the <code>dto</code> day in the default timezone. Returns <code>null</code> if the
   *   <code>dto</code> is <code>null</code>.
   */
  public static function toMidnightDate(dto : LocalDateDTO) : Date {
    return toMidnightDate(dto, DEFAULT_TIME_ZONE)
  }

  /**
   * Returns a number of days in a specific month.
   * @param year year containing the <code>month</code>. Leap years may make difference for the months.
   * @param month zero-based index of the month. (January is 0, December is 11).
   * @return number number of days in <code>month</code> month of the <code>year</code> year.
   */
  public static function daysInMonth(year : int, month : int) : int {
    final var cal = new GregorianCalendar()
    cal.clear()
    cal.set(Calendar.YEAR, year)
    cal.set(Calendar.MONTH, month)
    return cal.getActualMaximum(Calendar.DAY_OF_MONTH)
  }


  /**
   * Returns a number of days in a month denoted by the DTO. Day field of the DTO is ignored.
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>NullPointerException</code> - if dto is <code>null</code></dd>
   * </dl>
   * @param dto local date (year and month) for which a number of days is requested. Day field is ignored.
   * @return number of days in <code>dto.month</code> month of the <code>dto.year</code> year.
   */
  public static function daysInLocalDate(dto : LocalDateDTO) : int {
    return daysInMonth(dto.Year, dto.Month)
  }
}
