package edge.time

uses java.lang.Long
uses java.lang.IllegalArgumentException

/**
 * Utilities for operations on the local time.
 */
class LocalTimeUtil {
  /**
   * Total number of milliseconds per one day.
   */
  public static final var TOTAL_MILLIS_PER_DAY : long = 24l * 60l * 60l * 1000l;


  /**
   * Converts a local time into a number of milliseconds from the midnight.
   * @param dto DTO to convert.
   * @returns a number of milliseconds till midnight required to get to the time. Returns <code>null</code> if
   * the dto is <code>null</code>.
   */
  function toMillisOffset(dto : LocalTimeDTO) : Long {
    if (dto == null) {
      return null
    }

    final var minutesOffset = dto.Hour * 24l + dto.Minute;
    final var secondsOffset = minutesOffset * 60l + dto.Second
    return (secondsOffset * 1000l + dto.Millisecond)
  }


  /**
   * Converts a (millisecond) offset from the midnight into a corresponding local time DTO.
   * @param offset millisecond offset from the midnight to the required time.
   * @returns a local time DTO corresponding to the time offset. Returns <code>null</code> if offset is <code>null</code>.
   * @throws java.lang.IllegalArgumentException if offset is negative or not less that TOTAL_MILLIS_PER_DAY
   */
  function fromMillisOffset(offset : Long) : LocalTimeDTO {
    if (offset == null) {
      return null
    }

    if (offset < 0 || offset > TOTAL_MILLIS_PER_DAY) {
      throw new IllegalArgumentException("Invalid value " + offset + " for the offset, must be in a range [0, " + TOTAL_MILLIS_PER_DAY + ")")
    }

    var l = offset.longValue()
    final var res = new LocalTimeDTO()
    res.Millisecond = (l % 1000) as int
    l /= 1000
    res.Second = (l % 60) as int
    l /= 60
    res.Minute = (l % 60) as int
    l /= 60
    res.Hour = l as int
    return res
  }
}
