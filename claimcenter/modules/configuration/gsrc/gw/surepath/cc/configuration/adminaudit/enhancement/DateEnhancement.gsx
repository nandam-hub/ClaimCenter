package gw.surepath.cc.configuration.adminaudit.enhancement

uses java.util.Calendar
uses java.util.Date

enhancement DateEnhancement : Date {

  function addMonthsRespectingDayOfMonth_SP(iMonths : int): Date {
    var dateCal = Calendar.getInstance()
    dateCal.setTime(this)
    var initialDayOfMonth = dateCal.get(5)
    dateCal.add(2, iMonths)
    dateCal.set(5, initialDayOfMonth > dateCal.getActualMaximum(5) ? dateCal.getActualMaximum(5) : initialDayOfMonth)
    return dateCal.Time
  }
}