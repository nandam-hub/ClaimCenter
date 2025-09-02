package edge.capabilities.locale.util

uses java.text.DateFormat
uses gw.api.util.LocaleUtil
uses java.util.Date

final class DateFormatter {
  public static function formatShortDate (date: Date):String {
    var locale = LocaleUtil.getCurrentLanguage().JavaLocale
    return DateFormat.getDateInstance(DateFormat.SHORT, locale).format(date)
  }
}
