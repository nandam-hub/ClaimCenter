/**
 * This is a batch process that clears out completed workflow logs that are <N> days old.
 *
 * @param WorkflowLogPurgeDaysOld The number of days old to use for purging older WorkflowLogs
 * @param WorkflowLogPurgeRowLimit The number of rows to limit an individual database Delete statement
 *
 * This new version uses streaming DELETE statements to delete the old WorkflowLogs.  The rowLimit parameter
 * limits the number of logs to delete in a single database request.  Note that if the value is set to zero
 * the code will always process all available WorkflowLogs in a single streaming DELETE statement.
 */
package gw.processes

uses com.guidewire.pl.system.database.DatabaseDependencies
uses com.guidewire.pl.system.database.ChunkingProcessor
uses com.guidewire.pl.system.database.impl.QueryImpl
uses com.guidewire.pl.system.database.metadata.TableMetadata
uses com.guidewire.pl.system.database.query.DeleteBuilder
uses com.guidewire.pl.system.database.query.impl.QueryExpressions
uses com.guidewire.pl.system.database.query.impl.QueryExpressionToSQLData
uses com.guidewire.pl.system.logging.PLLoggerCategory
uses gw.api.database.IQueryBeanResult
uses gw.api.database.InOperation
uses gw.api.database.Queries
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.PLConfigParameters
uses gw.api.upgrade.Coercions
uses gw.api.util.DateUtil

@Export
class PurgeWorkflowLogs extends BatchProcessBase
{
  var _daysOld = PLConfigParameters.WorkflowLogPurgeDaysOld.Value
  var _deleteChunkSize = PLConfigParameters.WorkflowLogPurgeRowLimit.Value

  construct() {
    this(null)
  }

  construct(daysOld : int, rowLimit : int) {
    this({daysOld, rowLimit})
  }

  private construct(arguments : Object[]) {
    super(TC_PURGEWORKFLOWLOGS)
    if (arguments != null) {
      _daysOld = arguments[0] != null ? (Coercions.makeIntFrom(arguments[0])) : _daysOld
      _deleteChunkSize = arguments[1] != null ? (Coercions.makeIntFrom(arguments[1])) : _deleteChunkSize
    }
  }

  private function buildRestrictionToRetrieveOldEntries (query : Query, daysOld : int) {
    query.and(\r -> {
      r.subselect("Workflow", InOperation.CompareIn, Query.make(Workflow), "ID").compare(Workflow.STATE_PROP.get(), Relop.Equals, WorkflowState.TC_COMPLETED)
      r.compare(WorkflowLogEntry.LOGDATE_PROP.get(), Relop.LessThan, DateUtil.currentDate().addDays(-daysOld))
    })
  }

  // Legacy: used in Policy Center
  function getQueryToRetrieveOldEntries( daysOld : int ) : IQueryBeanResult<KeyableBean> {
    var query = Query.make(WorkflowLogEntry)
    buildRestrictionToRetrieveOldEntries (query, _daysOld)
    return query.select()
  }

  override function doWork() : void {
    final var querySupport = DatabaseDependencies.getDatabase().getDBSupport().getQuerySupport()

    // Build simple query with restriction
    var query = Queries.createQuery(WorkflowLogEntry)
    buildRestrictionToRetrieveOldEntries(query, _daysOld)

    // Construct select statement from query restriction
    var queryImpl : QueryImpl = query.getRawQuery().deepClone();
    final var queryTableName = TableMetadata.getTableName(query.getEntityType())
    queryImpl.setRootName(queryTableName);
    var selectStatement = QueryExpressionToSQLData.getSQLData(QueryExpressions.createQueryExpression(queryImpl, false,
        Collections.emptyList(), Collections.emptyList(), 0, ChunkingProcessor.NO_CHUNKING))

    // If rowLimit is set to a positive value attempt to breakup DELETE into multiple smaller updates
    PLLoggerCategory.SERVER_DATABASE.info("PurgeWorkflowLogs: delete chunk size = " + _deleteChunkSize)
    var deleteBuilder = new DeleteBuilder(query).withCommitChunkSize(_deleteChunkSize)
    setOperationsCompleted(deleteBuilder.execute())
  }
}