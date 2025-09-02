package gw.surepath.cc.configuration.timeline.creation.ui

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses org.json.JSONArray
uses org.json.JSONObject

uses java.util.ArrayList
uses java.util.Date

/**
 * .
 */
@IncludeInDocumentation
public class MonthModel {
  var days : List<DayModel> as Days

  construct (entries : List<TimelineEntry_SP>) {
    days = process(entries)
  }

  function process(entries : List<TimelineEntry_SP>) : List<DayModel> {
    var previousDate : Date = null
    var currentDate : Date = null
    var currentDays = new ArrayList<DayModel>()
    var currentDayEntries = new ArrayList<TimelineEntry_SP>()
    for (entry in entries) {
      currentDate = entry.EventDate
      if (previousDate != null && (currentDate.compareIgnoreTime(previousDate) != 0)) {
        currentDays.add(new DayModel(currentDayEntries, previousDate))
        currentDayEntries = new ArrayList<TimelineEntry_SP>()
      }
      currentDayEntries.add(entry)
      previousDate = currentDate
    }
    if (currentDayEntries.size() > 0) {
      currentDays.add(new DayModel(currentDayEntries, currentDate))
    }
    return currentDays
  }

  public function toJSONObject() : JSONObject{
    var daysJSON = new JSONArray()
    for (day in days) {
      daysJSON.put(day.toJSONObject())
    }
    var monthJSON = new JSONObject()
    monthJSON.put("days", daysJSON)
    return monthJSON
  }
}
