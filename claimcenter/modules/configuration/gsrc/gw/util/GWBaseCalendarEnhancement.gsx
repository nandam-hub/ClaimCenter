package gw.util
uses java.util.Calendar

enhancement GWBaseCalendarEnhancement : java.util.Calendar
{
  /**
   * Trim the given Calendar to midnight.  That is to say, set days, hours,
   * minutes, seconds, and millis to zero.
   * @return a Calendar without any time component.
   */
  function trimToMidnight() : Calendar {
    var cal = this.clone() as Calendar;
    cal.set(Calendar.HOUR_OF_DAY, 0);
    cal.set(Calendar.MINUTE, 0);
    cal.set(Calendar.SECOND, 0);
    cal.set(Calendar.MILLISECOND, 0);
    return cal;
  }
}
