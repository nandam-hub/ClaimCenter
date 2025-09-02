package gw.surepath.cc.configuration.adminaudit.util

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.util.DisplayableException
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.Exception

/**
 * Provides drop down list data for the admin audit search page and dynamically
 * builds and executes the search query returning the search results
 * to the UI
 */
@IncludeInDocumentation
class DataAuditSearchUtil {
  private static var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.DisplayName)

  /**
   * Creates unique array of entity names from audit data
   *
   * @return String[] - array of entity names
   */
  @IncludeInDocumentation
  public static function retrieveAuditableEntityTypes(): String[] {
    var retVal: String[] = {}
    try {
      var q = Query.make(DataAudit_SP)
      q.withDistinct(true)
      retVal = q.select({
        QuerySelectColumns.pathWithAlias(DataAudit_SP#AuditableBeanEntityType.PropertyInfo.Name,
            Paths.make(DataAudit_SP#AuditableBeanEntityType))
        }).transformQueryRow(\row -> row.getColumn(DataAudit_SP#AuditableBeanEntityType.PropertyInfo.Name) as String )
          .toTypedArray()
    }
    catch (e: Exception) {
      _logger.error(e.Message, DataAuditSearchUtil#retrieveAuditableEntityTypes(), e)
    }
    return retVal
  }

  /**
   * Purpose: Dynamically build and execute query based on provided search criteria
   *
   * @param searchCriteria DataAuditSearchCriteria - contains filter elements
   * @return IQueryBeanResult - search results
   */
  @IncludeInDocumentation
  public static function executeSearch(searchCriteria: DataAuditSearchCriteria): IQueryBeanResult<DataAudit_SP> {
    //first, validate minimum search criteria has been met
    if (not searchCriteria.MinimumSearchCriteriaMet) {
      throw new DisplayableException(DisplayKey.get("SP.AdminAudit.Exception.MinimumSearchCriteriaNotMet"))
    }

    var retVal: IQueryBeanResult<DataAudit_SP> = null

    try {
      var q = Query.make(DataAudit_SP)
      if (searchCriteria.PerformingUser != null) {
        q.compare(DataAudit_SP#PerformingUser, Equals, searchCriteria.PerformingUser)
      }
      if (searchCriteria.EntityType != null and not searchCriteria.EntityType.Blank) {
        q.compare(DataAudit_SP#AuditableBeanEntityType, Equals, searchCriteria.EntityType)
      }
      if (searchCriteria.AuditableEntityStatus != null) {
        q.compare(DataAudit_SP#AuditableBeanStatus, Equals, searchCriteria.AuditableEntityStatus)
      }
      compareOnDateCriteria(q, searchCriteria.OccurrenceStartDate, searchCriteria.OccurrenceEndDate)
      retVal = q.select()
      retVal.setPageSize(DataAuditorProperties.INSTANCE.AdminAuditSearchResultLimit)
    }
    catch (e: Exception) {
      _logger.error(e.Message, DataAuditSearchUtil#executeSearch(DataAuditSearchCriteria), e)
      throw new DisplayableException(DisplayKey.get("SP.AdminAudit.Exception.SearchError"))
    }
    return retVal
  }

  private static function compareOnDateCriteria(q: Query<DataAudit_SP>, startDate: Date, endDate: Date) {
    if (startDate != null) {
      q.compare(entity.DataAudit_SP#OccurrenceDate, Relop.GreaterThanOrEquals, startDate)
    }
    if (endDate != null) {
      q.compare(entity.DataAudit_SP#OccurrenceDate, Relop.LessThanOrEquals, endDate)
    }
  }
}