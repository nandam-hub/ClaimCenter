package gw.cmdline.util

uses gw.lang.cli.*

class TableImportArgs {

  /**
   * allow references to existing rows in all source tables
   */
   static var _allReferencesAllowed : Boolean as Allreferencesallowed

  /**
   * clear the error table
   */
   static var _clearError : Boolean as Clearerror

  /**
   * clear the exclusion table
   */
   static var _clearExclusion : Boolean as Clearexclusion

  /**
   * clear the staging tables
   */
   static var _clearStaging : Boolean as Clearstaging

  /**
   * delete rows from staging tables based on contents of exclusion table
   */
   static var _deleteExcluded : Boolean as Deleteexcluded

  /**
   * populate the exclusion table with rows to be excluded
   */
   static var _populateExclusion : Boolean as Populateexclusion

  /**
   * check the integrity of the contents of the staging tables; can optionally specify 'clearerror', 'populateexclusion' and 'allreferencesallowed'
   */
   static var _integrityCheck : Boolean as Integritycheck

  /**
   * check the integrity of the contents of the staging tables and load source tables if no errors; can optionally specify 'clearerror', 'populateexclusion', 'allreferencesallowed', 'estimateorastats' and 'zonedataonly'
   */
   static var _integrityCheckAndLoad : Boolean as Integritycheckandload

  /**
   * use Zone data only in this import
   */
   static var _zoneDataOnly : Boolean as Zonedataonly

  /**
   * deprecated, does not do anything.  Previously was comma separated list of message sinks for which imported claims/exposures should be marked as synced (only applicable if 'integritycheckandload' set)
   */
   static var _messageSinks : String as Messagesinks

  /**
   * update database statistics on the staging tables
   */
   static var _updateDatabaseStatistics : Boolean as Updatedatabasestatistics

  /**
   * encrypt columns configured to be encrypted in the staging tables
   */
   static var _encryptStagingTables : Boolean as Encryptstagingtbls

  /**
   * update database statistics on the source tables with estimated row and block counts for the source tables and indexes at the beginning of load (integritycheckandload) when running against Oracle
   */
   static var _estimateOraStats : Boolean as Estimateorastats

  /**
   * Number of threads to use when running integrity checks.  If specified, overrides configured value of loader attribute num-threads-integrity-checking.  Value of 1 means no mulithreading.
   */
   static var _numThreadsIntegrityChecking : Integer as Numthreadsintegritychecking

  /**
   * List the N most recent available load history reports.
   */
  @ShortName( "listLoadHistoryReports" )
  @LongName( "listLoadHistoryReports" )
  @ArgNames( {"numReports"} )
  @ArgOptional
  static var _listLoadHistoryReports : String[] as ListLoadHistoryReports

  /**
   * Download a load history report.  Can use the -filepath option.
   */
  @ShortName( "getLoadHistoryReport" )
  @LongName( "downloadLoadHistoryReport" )
  @ArgNames( {"id"} )
  static var _downloadLoadHistoryReport : String[] as DownloadLoadHistoryReport

  /**
   * runs the command in a batch process (only applicable to integritycheck, integritycheckandload, populateexclusion, deleteexcluded, and updatedatabasestatistics options
   */
   static var _batch : Boolean as Batch

  /**
   * The root server URL to access
   */
  @DefaultValue( 
          "http://localhost:8080/cc" )
  static var _server : String as Server

  /**
   * The user to log in as.  Or "-" to prompt for user
   */
  @DefaultValue( "su" )
  static var _user : String as User

  /**
   * The password to use.  Or "-" to prompt for password
   */
  @Required
  static var _password : String as Password

  /**
   * Path for location of downloaded report (optional)
   */
  @ShortName( "filepath" )
  @LongName( "filepath" )
  static var _filepath : String as FilePath


}
