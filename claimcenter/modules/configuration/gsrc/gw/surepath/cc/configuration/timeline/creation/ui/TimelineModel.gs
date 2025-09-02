package gw.surepath.cc.configuration.timeline.creation.ui

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses org.json.JSONArray

uses java.util.ArrayList
uses java.util.Calendar
uses java.util.GregorianCalendar

/**
 * It processes the Timeline entries based on the timestamp and returns the list in the way that the latest entry
 * is in the top of the list. The month model is used to process the TimelineEntry_SP entities.
 */
@IncludeInDocumentation
public class TimelineModel {
  var months : List<MonthModel> as Months

  construct (entries : TimelineEntry_SP[]) {
    months = process(entries)
  }

  function process(entries : TimelineEntry_SP[]) : List<MonthModel> {
    var previousMonth = -1
    var currentMonth = -1
    var currentMonths = new ArrayList<MonthModel>()
    var currentMonthEntries = new ArrayList<TimelineEntry_SP>()
    var calendar = new GregorianCalendar()
    for (entry in entries) {
      calendar.setTime(entry.EventDate)
      currentMonth = calendar.get(Calendar.MONTH)
      if ((previousMonth != -1) && (currentMonth != previousMonth)) {
        currentMonths.add(new MonthModel(currentMonthEntries))
        currentMonthEntries = new ArrayList<TimelineEntry_SP>()
      }
      currentMonthEntries.add(entry)
      previousMonth = currentMonth
    }
    if (currentMonthEntries.size() > 0) {
      currentMonths.add(new MonthModel(currentMonthEntries))
    }
    return currentMonths
  }

  public function toJSONObject() : JSONArray {
    var monthsJSON = new JSONArray()
    for (month in months) {
      monthsJSON.put(month.toJSONObject())
    }
    return monthsJSON
  }
}
