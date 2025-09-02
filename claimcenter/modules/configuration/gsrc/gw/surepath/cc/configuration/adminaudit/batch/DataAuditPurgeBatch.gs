package gw.surepath.cc.configuration.adminaudit.batch

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DateUtil
uses gw.processes.BatchProcessBase
uses gw.surepath.cc.configuration.adminaudit.util.DataAuditorProperties
uses gw.surepath.suite.configuration.annotation.IncludeInDocumentation
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.Transaction

/**
 * Batch process to remove  {@link DataAudit_SP} records which are considered Old
 */
@IncludeInDocumentation
class DataAuditPurgeBatch extends BatchProcessBase {

  private static var _pageSize = 1024
  private static var _logger = StructuredLogger.CONFIG.createSubcategoryLogger(DataAudit_SP.Name)

  construct(){
    super(BatchProcessType.TC_PURGEDATAAUDITRECORDS_SP)
  }

  protected override function doWork() {
    _logger.info("Retiring Audit records batch starting")

    var records = EligibleRecords
    setChunkingById(records, _pageSize)
    this.OperationsExpected = records.Count

    var recordsIterator = records.iterator()
    while(recordsIterator.hasNext() and not TerminateRequested){
      var count = 0
      try {
        Transaction.runWithNewBundle(\bundle -> {
          while (recordsIterator.hasNext() and count < _pageSize and not TerminateRequested) {
            count++
            incrementOperationsCompleted()
            var record = recordsIterator.next()
            bundle.delete(record)
          }
        }, User.util.UnrestrictedUser)
      } catch (e : Exception){
        _logger.error("Unexpected Error found while trying to retire Audit Records", DataAuditPurgeBatch#doWork(),
            e)
        // if failure occurs, then all records would have failed to commit, therefore increment by the total failures
        this.OperationsFailed += count
      }
    }
    _logger.info("Retiring Audit records batch completed")
  }

  /**
   * Returns all audit records that are considered to be Old and candidates to be retired
   * @return All eligible Audit records to beretired
   */
  @IncludeInDocumentation
  private property get EligibleRecords() : IQueryBeanResult<DataAudit_SP> {
    _logger.debug("Finding eligible Audit records to retire")

    var subtractedDays = DataAuditorProperties.INSTANCE.DaysToKeepIfPrimary
    if(DataAuditorProperties.INSTANCE.SendToExternalSystem){
      subtractedDays = DataAuditorProperties.INSTANCE.DaysToKeepIfSecondary
    }
    var ageLimit = DateUtil.currentDate().addDays( - subtractedDays)

    _logger.debug("Finding Audit records older than date", {ageLimit})
    var query = Query.make(DataAudit_SP)
    query.compare(DataAudit_SP#CreateTime, Relop.LessThanOrEquals, ageLimit)
    var resultSet = query.select()
    _logger.debug("Total Audit Records found", {resultSet.Count})
    return resultSet
  }
}