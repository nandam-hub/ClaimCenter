package gw.surepath.cc.configuration.timeline.enhancement

uses gw.surepath.cc.configuration.timeline.creation.ui.TimelineUIUtil
uses org.json.JSONArray
uses org.json.JSONObject

uses java.lang.Integer
uses java.text.DateFormat
uses java.util.Calendar
uses java.util.GregorianCalendar

/**
 *
 */
enhancement TimelineEntry_SPEnhancement: TimelineEntry_SP {
  public function isEqualTo(b: Object): boolean {
    return ((b typeis TimelineEntry_SP) && this.EventDate.equals(b.EventDate)
        && this.Summary.equals(b.Summary)
        && this.TimelineCategory.equals(b.TimelineCategory))
  }
  public function toJSONObject() : JSONObject {
    var timeFormat = DateFormat.getTimeInstance(DateFormat.SHORT)
    var dateFormat = DateFormat.getDateInstance(DateFormat.SHORT)
    var calendar = new GregorianCalendar()
    var date = this.EventDate
    calendar.setTime(date)
    var dateForJump : String
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
    var entryJSON = new JSONObject()
    entryJSON.put("Summary", this.Summary)
    entryJSON.put("time", timeFormat.format(date))
    entryJSON.put("date", dateFormat.format(date))
    entryJSON.put("dateForJump", dateForJump)
    entryJSON.put("monthNumber", calendar.get(Calendar.MONTH) + 1)
    entryJSON.put("PublicID", this.PublicID)
    entryJSON.put("uiID", this.PublicID.remove(":"))
    var links = new JSONArray()
    for (link in this.TimelineLinks) {
      links.put(link.toJSONObject())
    }
    entryJSON.put("links", links)
    entryJSON.put("Category", TimelineUIUtil.typekeyToJSONObject(this.TimelineCategory))
    entryJSON.put("Importance", TimelineUIUtil.typekeyToJSONObject(this.Importance))
    return entryJSON
  }


  public function removeLink(linkSequenceNumber : int) {
    var firstOpeningMarkup = "<#${linkSequenceNumber}%"
    var closingMarkup = "%>"
    var summaryText = this.Summary
    var firstMarkupIndex = summaryText.indexOf(firstOpeningMarkup)

    if (firstMarkupIndex == -1) {
      throw "No timeline link found with sequence number: ${linkSequenceNumber}"
    }

    var firstPart = summaryText.substring(0, firstMarkupIndex)

    var afterFirstMarkupIndex = firstMarkupIndex + firstOpeningMarkup.length
    var afterFirstPart = summaryText.substring(afterFirstMarkupIndex)

    var secondMarkupIndex = afterFirstPart.indexOf(closingMarkup)
    var secondPart = afterFirstPart.substring(0, secondMarkupIndex)
    var thirdPart = afterFirstPart.substring(secondMarkupIndex + closingMarkup.length)
    var newSummary = firstPart + secondPart + thirdPart
    this.Summary = newSummary
  }
}
