package gw.cmdline.util

uses gw.lang.cli.ArgNames
uses gw.lang.cli.ArgOptional
uses gw.lang.cli.DefaultValue
uses gw.lang.cli.LongName
uses gw.lang.cli.Required
uses gw.lang.cli.ShortName


/**
 * Command line arguments for SystemToolsAPI.gs. The 'javadoc' and annotations will be used for -usage and -help output. Please put them into one line without line breaks like this line.
 */
class SystemToolsArgs {

  /**
   * The root server URL to access
   * XXX: Newline added as a workaround to Maven filtering.
   */
  // In-string values 8080, etc substituted during admin build. Has to be in two lines. Don't join those lines!
  @DefaultValue( 
          "http://localhost:8080/cc" )
//                "http://for.testing/cc")
  @ShortName( "server" )
  @LongName( "server" )
  static var _server : String as Server

  /**
   * The user to log in as.  Or "-" to prompt for user
   */
  @DefaultValue( "su" )
  @ShortName( "user" )
  @LongName( "user" )
  static var _user : String as User

  /**
   * The password to use.  Or "-" to prompt for password
   */
  @ShortName( "password" )
  @LongName( "password" )
  @Required
  static var _password : String as Password

  /**
   * Print the runlevel of the server
   */
  static var _ping : Boolean as Ping

  /**
   * Run the database consistency checks as a batch job.
   */
  @ShortName( "checkdbconsistency" )
  @LongName( "checkdbconsistency" )
  @ArgNames( {"tables", "checktypes"} )
  @ArgOptional
  static var _checkDBConsistencyAsBatch : String[] as CheckDBConsistency

  /**
   * Checks whether consistency checks are currently running.
   */
  @ShortName( "getdbccstate" )
  @LongName( "getdbccstate" )
  @ArgNames( {"dummy"} )
  @ArgOptional
  static var _dbccState : String[] as GetDBCCState

  /**
   * Update statistics as a batch job.
   */
  @ShortName( "updatestatistics" )
  @LongName( "updatestatistics" )
  @ArgNames( {"description", "incremental"} )
  @ArgOptional
  static var _updateStatistics : String[] as UpdateStatistics

  /**
   * Cancel the update stats process if running. Use -getupdatestatsstate to check on the state.
   */
  @ShortName( "cancelupdatestats" )
  @LongName( "cancelupdatestats" )
  @ArgNames( {"dummy"} )
  @ArgOptional
  static var _cancelUpdateStats : String[] as CancelUpdateStats

  /**
   * Checks whether the update stats process is currently running.
   */
  @ShortName( "getupdatestatsstate" )
  @LongName( "getupdatestatsstate" )
  @ArgNames( {"dummy"} )
  @ArgOptional
  static var _getUpdateStatsState : String[] as GetUpdateStatsState

  /**
   * Gets the list of SQL statements to update database statistics
   */
  @ShortName( "getdbstatisticsstatements" )
  static var _dbStats : boolean as GetDBStatisticsStatements

  /**
   * Return the incremental db stats for this server based in update threshold
   */
  @ShortName( "getincrementaldbstatisticsstatements" )
  static var _dbIncrementalStats : boolean as GetIncrementalDBStatisticsStatements

  /**
   * List the N most recent SQL Server Query Store runtime stats intervals
   */
  @ShortName( "sqlListIntervals" )
  @LongName( "listSqlServerQueryStoreIntervals" )
  @ArgNames( {"numIntervals"} )
  static var _queryStoreIntervals : String[] as QueryStoreIntervals

  /**
   * Run SQL Server DMV Perf Report.
   */
  @ShortName( "mssqlPerfRpt" )
  @LongName( "runSqlServerPerfReport" )
  @ArgNames( {"beginIntervalID", "endIntervalID", "collectstatistics"} )
  @ArgOptional
  static var _sqlServerPerfReport : String[] as SqlServerPerfReport

  /**
   * List the N most recent Oracle AWR snapshots.
   */
  @ShortName( "oraListSnaps" )
  @LongName( "listOracleAwrSnapshots" )
  @ArgNames( {"numSnapshots"} )
  static var _awrSnapshots : String[] as AwrSnapshots

  /**
   * Run the Oracle AWR performance report.
   */
  @ShortName( "oraPerfRpt" )
  @LongName( "runOracleAwrPerfReport" )
  @ArgNames( {"beginSnapshotIdOrHelp", "endSnapshotId", "probevDollarTablesOrPropertiesFileName"} )
  static var _awrReport : String[] as RunAwrReport

  /**
   * List the N most recent available database perf reports.
   */
  @ShortName( "listPerfReports" )
  @LongName( "listDatabasePerformanceReports" )
  @ArgNames( {"numReports"} )
  @ArgOptional
  static var _listPerfDownloads : String[] as ListPerfReports

  /**
   * Download a database performance report.  Can use the -filepath option.
   */
  @ShortName( "getPerfReport" )
  @LongName( "downloadDatabasePerfReport" )
  @ArgNames( {"id"} )
  static var _downloadDbReport : String[] as DownloadPerfReport

  /**
   * Download zip of database catalog statistics report. Optional args 'tables' 'stagingtables' 'typelisttables'.  Can use the -filepath option.
   */
  @ShortName( "dbcatstats" )
  @LongName( "dbcatstats" )
  @ArgNames( {"tables", "stagingTables", "typelistTables"} )
  @ArgOptional
  static var _reportDBStats : String[] as ReportDBStats

  /**
   * Path for location of downloaded report (optional)
   */
  @ShortName( "filepath" )
  @LongName( "filepath" )
  static var _filepath : String as FilePath

  /**
   * Return the version of the server
   */
  @ShortName( "version" )
  @LongName( "version" )
  static var _version : Boolean as Version

  /**
   * Set the server to maintenance mode
   */
  @ShortName( "maintenance" )
  @LongName( "maintenance" )
  static var _maint : Boolean as Maintenance

  /**
   * Set the server to daemons mode
   */
  @ShortName( "daemons" )
  @LongName( "daemons" )
  @ArgOptional
  static var _daem : Boolean as Daemons

  /**
   * Set the server to multiuser mode
   */
  @ShortName( "multiuser" )
  @LongName( "multiuser" )
  static var _multiUser : Boolean as MultiUser

  /**
   * Get the session information of the server
   */
  @ShortName( "sessioninfo" )
  @LongName( "sessioninfo" )
  static var _sessionInfo : Boolean as SessionInfo

  /**
   * Deactivate a user and terminate existing sessions
   */
  @ShortName( "deactivate")
  @LongName( "deactivateuser")
  static var _deactivateuser : String as DeactivateUsername

  /**
   * Update the logging level of logger with the given name. For root logger, use RootLogger as the name. Two arguments, loggerName and level
   */
  @ShortName( "updatelogginglevel" )
  @LongName( "updatelogginglevel" )
  static var _updateLoggingLevel : String[] as UpdateLoggingLevel

  /**
   * Get the logger categories available in the system
   */
  @ShortName( "loggercats" )
  @LongName( "loggercats" )
  static var _loggerCategories : Boolean as LoggerCategories

  /**
   * Tell the server to reload it's logging configuration file.
   */
  @ShortName( "reloadloggingconfig" )
  @LongName( "reloadloggingconfig" )
  static var _reloadLoggingConfig : Boolean as ReloadLoggingConfig

  /**
   * Recalculates file checksums used for clustered configuration verification.
   */
  @ShortName( "recalcchecksums" )
  @LongName( "recalcchecksums" )
  static var _recalcChecksums : Boolean as RecalculateChecksums

  /**
   * Verify the data model matches the underlying physical database
   */
  @ShortName( "verifydbschema" )
  @LongName( "verifydbschema" )
  static var _verifyDBSchema : Boolean as VerifyDBSchema

  /**
   * Verify new config against existing config to determine compatibility.
   */
  @ShortName( "verifyconfig" )
  @LongName( "verifyconfig" )
  @ArgNames( {"pathToArchive", "requestedUpgrade"} )
  static var _verifyconfig : String[] as VerifyConfig

  /**
   * Include more details in the VerifyConfig report
   */
  @ShortName( "details")
  @LongName( "showDetails")
  static var _showDetails : boolean as ShowDetails

  /**
   * Starts the FULL upgrade process. Please refer to the docs for more details.
   */
  @ShortName( "startfullupgrade" )
  @LongName( "startFullUpgrade" )
  static var _startFullUpgrade : Boolean as StartFullUpgrade

  /**
   * Print list of cluster nodes.
   */
  @ShortName( "nodes")
  @LongName( "clusterNodes")
  static var _clusterNodes : boolean as ClusterNodes

  /**
   * Print list of cluster nodes.
   */
  @ShortName( "components")
  @LongName( "clusterComponents")
  static var _clusterComponents : boolean as ClusterComponents

  /**
   * Release tasks owning by the specified node. Can use the -evenifincluster option.
   */
  @ShortName( "nodefailed")
  @LongName( "nodeFailed")
  @ArgNames( "serverId" )
  static var _nodeFailed : String as NodeFailed

  /**
   * Consider node as failed even if it is still in the cluster,
   */
  @ShortName( "evenifincluster")
  @LongName( "evenIfInCluster")
  static var _evenIfInCluster : boolean as EvenIfInCluster

  /**
   * Manually complete component failover
  */
  @ShortName( "completefailedfailover" )
  @LongName( "completeFailedFailover" )
  @ArgNames({ "type", "componentId" })
  static var _completeFailedFailover : String[] as CompleteFailedFailover

  /**
   * Request component transfer
  */
  @ShortName( "requestcomponenttransfer" )
  @LongName( "requestComponentTransfer" )
  @ArgNames({ "type", "componentId", "targetOwner" })
  static var _requestComponentTransfer : String[] as RequestComponentTransfer

  /**
   * Schedule the shutdown of a specified server. Can use the -terminateBatchProcesses, -shutdownTime options.
   */
  @ShortName( "scheduleshutdown")
  @LongName( "scheduleShutdown")
  @ArgNames( "serverId" )
  static var _scheduleShutdown : String as ScheduleShutdown

  /**
   * Cancel the shutdown of a specified server
   */
  @ShortName( "cancelshutdown")
  @LongName( "cancelShutdown")
  @ArgNames( "serverId" )
  static var _cancelShutdown : String as CancelShutdown

  /**
   * Terminate batch processes on planned shutdown
   */
  @ShortName( "terminatebatchprocesses")
  @LongName( "terminateBatchProcesses")
  static var _terminateBatchProcesses : boolean as TerminateBatchProcesses

  /**
   * Planned shutdown delay in minutes, default is 60 (1 hour)
   */
  @DefaultValue("60")
  @ShortName( "shutdowndelay")
  @LongName( "shutdownDelayMinutes")
  static var _shutdownDelayMinutes : int as ShutdownDelayMinutes
}
