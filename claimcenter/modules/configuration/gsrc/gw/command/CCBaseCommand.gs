package gw.command

uses gw.api.tools.TestingClock
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.i18n.DateTimeFormat
uses gw.pl.persistence.core.Bundle

uses java.time.ZoneId
uses java.time.ZonedDateTime
uses java.time.temporal.TemporalAdjusters

@Export
class CCBaseCommand extends BaseCommand {

  protected var randomNumber : String;

  var testingClock = new TestingClock()
  
  construct() {
    randomNumber = CurrentDate.Time as java.lang.String
  }
  
  public property get Bundle() : Bundle {
    return TopLocation.Bundle
  }
  
  public property get Argument() : String {
    return Arguments.first().Value
  }
  
  property get CurrentDate() : Date {
    return testingClock.getDateTime()
  }
  
  property get CurrentClaim() : Claim {
    return getCurrentVarByType() ?: CurrentExposure.Claim
  }
  
  property get CurrentExposure(): Exposure {
    return getCurrentVarByType()
  }

  reified function getCurrentVarByType<T>(): T {
    return TopLocation.Variables.firstWhere(\ v -> v.Type == T).Value as T
  }

  function nextID() : String{
    return CurrentDate.Time as java.lang.String
  }

  function displayMessageAndExit(message : String) {
    throw new DisplayableException(message)
  }
  
  function addMonths(count : Double) : String {
    return setDate(CurrentDate.addMonths(count as int))
  }
  
  function addDays(count : Double) : String {
    return setDate(CurrentDate.addDays(count as int))
  }
  
  function addWeeks(count : Double) : String {
    return setDate(CurrentDate.addWeeks(count as int))
  }

  function addHours(count : Double) : String {
    return setDate(CurrentDate.addHours(count as int))
  }
  
  function setDate(newDate : Date) : String {
    testingClock.setDateTime( newDate )
    return "Today is: " + CurrentDate + " " + CurrentDate.formatTime(DateTimeFormat.MEDIUM)
  }

  function gotoEndOfMonth() {
    var currentDate = ZonedDateTime.ofInstant(DateUtil.currentDate().toInstant(), ZoneId.systemDefault());
    var lastDayOfMonth = currentDate.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth()

    if (CurrentDate.DayOfMonth != lastDayOfMonth) {
      var fromDate = ZonedDateTime.ofInstant(CurrentDate.toInstant(), ZoneId.systemDefault())
      var fromDay = fromDate.getDayOfMonth()
      if (fromDay >= lastDayOfMonth) {
        fromDate = fromDate.plusMonths(1)
      }
      var maxDay = fromDate.with(TemporalAdjusters.lastDayOfMonth()).getDayOfMonth()
      fromDate = fromDate.withDayOfMonth(maxDay > lastDayOfMonth ? lastDayOfMonth : maxDay)
      setDate(Date.from(fromDate.toInstant()))
    }
  }
}
