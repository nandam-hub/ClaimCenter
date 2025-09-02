package gw.surepath.cc.configuration.adminaudit.util

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

uses java.io.Serializable


/**
 * Data structure used to search for admin audit records.
 */
@IncludeInDocumentation
@Export
class DataAuditSearchCriteria implements Serializable {

  construct() {

  }

  var _occurrenceStartDate : Date as OccurrenceStartDate
  var _occurrenceEndDate : Date as OccurrenceEndDate
  var _auditableEntityType : String as EntityType
  var _performingUser : User as PerformingUser
  var _auditableEntityStatus: BeanStatus_SP as AuditableEntityStatus


  /**
   * Purpose: Define minimum viable search criteria required for search
   */
  @IncludeInDocumentation
  property get MinimumSearchCriteriaMet(): boolean {
    var validDateRangeSpecified = _occurrenceStartDate != null and _occurrenceEndDate != null and
        _occurrenceStartDate.addMonthsRespectingDayOfMonth_SP(6).compareIgnoreTime(_occurrenceEndDate) >= 0
    return (_performingUser != null or _auditableEntityType != null) and validDateRangeSpecified
  }

  property set OccurrenceStartDate(val: Date) {
    if (OccurrenceEndDate != null and OccurrenceEndDate.compareIgnoreTime(val) < 0) {
      throw new DisplayableException(DisplayKey.get("SP.AdminAudit.Exception.SearchDateRangeInvalid"))
    }
    _occurrenceStartDate = val
  }

  property set OccurrenceEndDate(val: Date) {
    if (OccurrenceStartDate != null and OccurrenceStartDate.compareIgnoreTime(val) > 0) {
      throw new DisplayableException(DisplayKey.get("SP.AdminAudit.Exception.SearchDateRangeInvalid"))
    }
    _occurrenceEndDate = val
  }
}
