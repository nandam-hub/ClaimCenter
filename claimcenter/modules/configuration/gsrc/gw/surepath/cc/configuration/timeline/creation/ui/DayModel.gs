package gw.surepath.cc.configuration.timeline.creation.ui

uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses org.json.JSONArray
uses org.json.JSONObject

uses java.lang.Integer
uses java.text.DateFormat
uses java.util.Date

/**
 * This is the daymodel for the Claim Timeline which is used for the Jump To Functionality of the
 * Claim Timeline. Baed on the day selected, the timeline scrolls to the desired date to view the events from
 * that day onwards
 */
@IncludeInDocumentation
public class DayModel {
  var dateForJump : String as DateForJump
  var dateString : String as DateString
  var entries : List<TimelineEntry_SP> as TimelineEntries

  construct(givenEntries : List<TimelineEntry_SP>, date : Date) {
    var dateFormat = DateFormat.getDateInstance(DateFormat.SHORT)
    dateString = dateFormat.format(date)
    entries = givenEntries
    var day = date.DayOfMonth
    var dayStr = Integer.toString(day)
    if (day < 10) {
      dayStr = "0" + dayStr
    }
    var month = date.MonthOfYear
    var monthStr = Integer.toString(month)
    if (month < 10) {
      monthStr = "0" + monthStr
    }
    var yearStr = Integer.toString(date.YearOfDate)
    dateForJump = dayStr + monthStr + yearStr
  }

  public function toJSONObject() : JSONObject {
    var dayJSON = new JSONObject()
    var entryList = new JSONArray()
    for (entry in entries) {
      entryList.put(entry.toJSONObject())
    }
    dayJSON.put("entries", entryList)
    dayJSON.put("date", dateString)
    dayJSON.put("dateForJump", dateForJump)
    return dayJSON
  }
}
