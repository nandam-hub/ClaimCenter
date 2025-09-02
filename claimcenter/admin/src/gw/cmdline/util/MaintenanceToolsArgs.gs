package gw.cmdline.util

uses gw.lang.cli.*

class MaintenanceToolsArgs {

  /**
   * Starts the named process. Requires one argument: the name of the process to start. Use -args to specify arguments.
   */
  @ShortName( "startprocess" )
  static var _startProcess : String as StartProcess

  /**
   * The starting process arguments, use with -startprocess
   */
  @ShortName( "args" )
  static var _arguments : String[] as Arguments

  /**
   * A name or process number to return the process status of
   */
  @ShortName( "processstatus" )
  static var _processStatus : String as ProcessStatus

  /**
   * A name or process number to terminate
   */
  @ShortName( "terminateprocess" )
  static var _terminateProcess : String as TerminateProcess

  /**
   * Prints the date and time at which db stats were last calculated for this server
   */
  @ShortName( "whenstats" )
  static var _whenStats : boolean as WhenStats

  /**
   * Marks the claims identified by -claims or -file for purge.
   */
  @ShortName( "markforpurge" )
  static var _claimsForPurge : Boolean as MarkClaimForPurge

  /**
   * Rebuilds the aggregate limits on policy periods for policies identified by -policies,
   * or the policy periods that contain claims identified by -claims or -file.
   */
  @ShortName( "rebuildagglimits" )
  static var _rebuildAggLimits : Boolean as RebuildAggLimits

  /**
   * Tells the rebuildagglimits command to mark all aggregrate limits in the database as invalid, and then
   * starts the AggLimitCalc work queue to rebuild them asynchronously.
   */
  @ShortName( "forceall" )
  static var _forceAll : Boolean as ForceAll

  /**
   * Takes a comma-separated list of one or more policy numbers; used by the rebuildagglimits command to select the policies on which to operate
   */
  @Separator( "," )
  static var _policies : String[] as Policies

  /**
   * If MarkClaimForPurge is true then this flag determines whether claims that are part of an aggregate
   * limit can be purged or not. True means they can be purged, false means they cannot be purged.
   */
  @ShortName( "purgefromaggregatelimit" )
  @DefaultValue("false")
  static var _purgeFromAggregateLimit : Boolean as PurgeFromAggregateLimit

  /**
   * Takes a comma-separated list of one or more claim numbers; used by several commands to select the claims on which to operate
   */
  @Separator( "," )
  static var _claims : String[] as Claims

  /**
   * Takes the path to a file containing a comma-separated list of claim numbers; used by several commands to select
   * the claims on which to operate
   */
  static var _file : String as File

  /**
   * Takes the root URL for the server to be accessed; if not specified, a default port on localhost is used
   */
  @DefaultValue( 
          "http://localhost:8080/cc" )
  static var _server : String as Server

  /**
   * Takes the username of the user to log in as; default is 'su'
   */
  @DefaultValue( "su" )
  static var _user : String as User

  /**
   * Takes the password to use when logging into the server
   */
  @DefaultValue( "gw" )
  static var _password : String as Password

  /**
   * Schedules the claims identified by -claims or -file for archive.
   */
  @ShortName( "scheduleforarchive" )
  static var _scheduleClaimForArchive : boolean as ScheduleClaimForArchive

  /**
   * Restores the claims identified by -claims or -file. Requires one argument: a comment to be recorded on each restored claim.
   */
  @ShortName( "restore" )
  static var _resoreClaim : String as RestoreClaim

 /**
   * The PublicID of the contact to change subtype for. Must also set -changesubtypetargettype
   */
  @ShortName( "changesubtypepublicid" )
  static var _changeSubtypePublicID : String as ChangeSubtypePublicID

  /**
    * The target type to change contact to. Must also set -changesubtypepublicid
    */
  @ShortName( "changesubtypetargettype" )
  static var _changeSubtypeTargetType : String as ChangeSubtypeTargetType
}
