package gw.surepath.cc.configuration.activitymanagement.util

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation

/**
 * Activity Management: This class is used for retrieving the existing
 * CrossAppActPattern_SP
 */
@IncludeInDocumentation
class ActivityPatternFinder {

  /**
   * Retrieves the Cross Suite Activity Patterns
   * @return IQueryBeanResult of the found CrossAppActPatter_sp
   */
  @IncludeInDocumentation
  public static function retrieveCrossSuiteActivityPatterns(): IQueryBeanResult<CrossAppActPattern_SP> {
    var result = Query.make(entity.CrossAppActPattern_SP).select()
    return result
  }

}