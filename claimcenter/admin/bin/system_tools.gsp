uses gw.api.database.AWRReportUserSettingsFactory
uses gw.api.tools.FilenameDigestPairFactory
uses gw.cmdline.util.ServerRunLevelVerifier
uses gw.cmdline.util.SystemToolsArgs
uses gw.cmdline.util.ToolkitUtils
uses gw.lang.cli.CommandLineAccess
uses gw.util.StreamUtil
uses gw.wsi.pl.systemtoolsapi.SystemToolsAPI
uses gw.wsi.pl.systemtoolsapi.enums.ComponentType
uses gw.wsi.pl.systemtoolsapi.enums.RequestedUpgrade
uses gw.wsi.pl.systemtoolsapi.enums.SystemOutLogger_LoggingLevel
uses gw.wsi.pl.systemtoolsapi.faults.ServerStateException
uses gw.wsi.pl.systemtoolsapi.types.complex.AWRReportUserSettings
uses gw.wsi.pl.systemtoolsapi.types.complex.FilenameDigestPair
uses gw.wsi.pl.systemtoolsapi.types.complex.ProcessID
uses gw.wsi.pl.systemtoolsapi.types.complex.ShutdownOptions
uses gw.wsi.pl.systemtoolsapi.types.complex.VerifyConfigReportOptions

uses java.io.ByteArrayInputStream
uses java.io.File
uses java.io.FileOutputStream
uses java.io.IOException
uses java.text.DateFormat

//Initialize the args class for this program
CommandLineAccess.initialize( SystemToolsArgs )

print( "Running ${Gosu.getCurrentProgram().Name}" )

SystemToolsArgs.User = ToolkitUtils.getFromConsole("User:", SystemToolsArgs.User)
SystemToolsArgs.Password = ToolkitUtils.getFromConsole("Password:", SystemToolsArgs.Password)
//New up a messaging soap service
var config = ToolkitUtils.initConfig("/ws/gw/wsi/pl/SystemToolsAPI",
    SystemToolsArgs.Server,
    SystemToolsArgs.User,
    SystemToolsArgs.Password)
var api = new SystemToolsAPI( config )
print( "Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}" )

//Ping the server and print its current run level
if( SystemToolsArgs.Ping ) {
  confirmRunLevelMaintenance()
  var result = api.getRunlevel()
  var runLevelString = "unknown mode : " + result
  if( result == MULTIUSER) {
    runLevelString = "ready (multiuser mode)"
  } else if( result == STARTING ) {
    runLevelString = "starting up"
  } else if ( result == MAINTENANCE ) {
    runLevelString = "in maintenance mode"
  } else if ( result == DAEMONS ) {
    runLevelString = "in daemons mode"
  }
  print( "Server on '${SystemToolsArgs.Server}' is ${runLevelString}" )
} else if( SystemToolsArgs.CheckDBConsistency != null ) {
  //Perform DB consistency checks
  try {
  if (SystemToolsArgs.CheckDBConsistency.length == 0) {
    print( "Submitting DBCC batch job for all database tables from server at '${SystemToolsArgs.Server}'" )
    print( "View results on the Consistency Checks Server Tools Info Page." )
    confirmRunLevelMaintenance()
    var pid = api.submitDBCCBatchJob(null, null)
    print( "Database Consistency Checks batch job is being run with PID ${pid.Pid}" )
  } else if( SystemToolsArgs.CheckDBConsistency.length != 2 ) {
    print( "Please specify both a table selection and a consistency check type selection" )
  } else {
    var tablesToCheckArray = convertCommandLineArg(SystemToolsArgs.CheckDBConsistency[0])
    var checksToRunArray = convertCommandLineArg(SystemToolsArgs.CheckDBConsistency[1])
    print("Submitting DBCC batch job for tables: ")
    printCommandLineArgs(tablesToCheckArray)
    print(" and running checks of type: " )
    printCommandLineArgs( checksToRunArray )
    print("View results on the Consistency Checks Server Tools Info Page." )
    confirmRunLevelMaintenance()
    var pid = api.submitDBCCBatchJob(tablesToCheckArray, checksToRunArray)
    print( "Database Consistency Checks batch job is being run with PID ${pid.Pid}" )
  }
  } catch ( e : ServerStateException ) {
    print ( "ERROR:  Unable to submit job.  Reason: ${e.Message}" )
  }
} else if( SystemToolsArgs.GetDBCCState != null and !SystemToolsArgs.GetDBCCState.equals("")) {
  //Check if DBCC is running
  print( "Checking state of consistency check run from server at '${SystemToolsArgs.Server}'" )
  confirmRunLevelMaintenance()
  print("The state of the consistency checks process is currently: " + api.getDBCCState())
} else if( SystemToolsArgs.UpdateStatistics != null ) {
  //Kick off the update stats process
  if (SystemToolsArgs.UpdateStatistics.length == 0) {
    print( "Submitting the INCREMENTAL update stats batch job to server at '${SystemToolsArgs.Server}'" )
    confirmRunLevelMaintenance()
    api.submitUpdateStats(null, true)
  } else if( SystemToolsArgs.UpdateStatistics.length != 2 ) {
    print( "Please specify both a description and a boolean (true for INCREMENTAL and false for FULL update stats)" )
  } else {
    var descriptionParam = SystemToolsArgs.UpdateStatistics[0]
    var incrementalParam = parseBoolean(SystemToolsArgs.UpdateStatistics[1])
    print("Submitting the update stats batch job with description: ")
    print(descriptionParam)
    print("and incremental: ")
    print(incrementalParam)
    try {
      confirmRunLevelMaintenance()
      api.submitUpdateStats(descriptionParam, incrementalParam)
    } catch ( e : ServerStateException) {
      print ( "Unable to submit job.  Reason: ${e.Message}" )
  }
  }
} else if( SystemToolsArgs.CancelUpdateStats != null and !SystemToolsArgs.CancelUpdateStats.equals("")) {
  //Cancel running update stats process
  print("Cancel the update stats process if running")
  confirmRunLevelMaintenance()
  api.cancelUpdateStats()
} else if( SystemToolsArgs.QueryStoreIntervals != null ) {
  if( SystemToolsArgs.QueryStoreIntervals.length != 1 ) {
    print( "Please specify one argument to QueryStoreIntervals, the number of most recent SQL Server Query Store runtime stats intervals to display." )
  } else {
    var numIntervals : int;
    var argError = false
    try {
      numIntervals = Integer.parseInt(SystemToolsArgs.QueryStoreIntervals[0])
    } catch ( e ) {
      argError = true
      print( "First argument to QueryStoreIntervals, '${SystemToolsArgs.QueryStoreIntervals[0]}', is not a number." )
    }
    if (!argError) {
      try {
        confirmRunLevelMaintenance()
        var intervalInfos = api.getRecentQueryStoreRuntimeStatsIntervalInfo(numIntervals)
        if (intervalInfos.length == 0) {
          print( "No Query Store runtime stats intervals found." )
        } else {
          print( "${numIntervals} most recent Query Store runtime stats intervals" )
          for( interval in intervalInfos ) {
            print("ID=${interval.ID}, StartIntervalTime=${interval.StartIntervalTime}, EndIntervalTime=${interval.EndIntervalTime}")
          }
        }
      } catch ( e ) {
        print ( "Unable to get snapshots.  Reason: ${e.Message}" )
      }
    }
  }
} else if( SystemToolsArgs.GetUpdateStatsState != null and !SystemToolsArgs.GetUpdateStatsState.equals("")) {
  //Check if the update stats process is running
  print( "Checking state of the update stats process from server at '${SystemToolsArgs.Server}'" )
  confirmRunLevelMaintenance()
  print("The state of the update stats process is currently: " + api.getUpdateStatsState())
} else if( SystemToolsArgs.SqlServerPerfReport != null ) {
  var usageSqlServerReport = "Please specify up to 3 arguments to SqlServerPerfReport: the begin and end interval IDs, and whether to collect statistics (false if omitted)"
  if( SystemToolsArgs.SqlServerPerfReport.length > 3) {
    print(usageSqlServerReport)
  } else {
    var beginIntervalID : Long = null
    var endIntervalID : Long = null
    var collectStatisticsParam = false
    try {
      if (SystemToolsArgs.SqlServerPerfReport.length == 3) {
        beginIntervalID = Long.parseLong(SystemToolsArgs.SqlServerPerfReport[0])
        endIntervalID = Long.parseLong(SystemToolsArgs.SqlServerPerfReport[1])
        collectStatisticsParam = parseBoolean(SystemToolsArgs.SqlServerPerfReport[2])
      } else if (SystemToolsArgs.SqlServerPerfReport.length == 2) {
        beginIntervalID = Long.parseLong(SystemToolsArgs.SqlServerPerfReport[0])
        try {
          endIntervalID = Long.parseLong(SystemToolsArgs.SqlServerPerfReport[1])
        } catch (e : NumberFormatException) {
          endIntervalID = beginIntervalID
          collectStatisticsParam = parseBoolean(SystemToolsArgs.SqlServerPerfReport[1])
        }
      } else if (SystemToolsArgs.SqlServerPerfReport.length == 1) {
        try {
          beginIntervalID = Long.parseLong(SystemToolsArgs.SqlServerPerfReport[0])
          endIntervalID = beginIntervalID
        } catch (e : NumberFormatException) {
          beginIntervalID = null
          endIntervalID = null
          collectStatisticsParam = parseBoolean(SystemToolsArgs.SqlServerPerfReport[0])
        }
      }
    } catch ( e ) {
      print("Unable to read parameters: Reason: ${e.Message}")
      throw e;
    }

    try {
      var pid : ProcessID
      if (beginIntervalID == null) {
        print("Submitting SQL Server Performance Report without Query Store and with collect statistics set to ${collectStatisticsParam}")
        print("View results on the SQL Server Performance Report Page or download it here.")
        confirmRunLevelMaintenance()
        pid = api.submitSqlServerPerfReportWithoutQueryStoreBatchJob(collectStatisticsParam)
      } else {
        print("Submitting SQL Server Performance Report from interval ${beginIntervalID} to ${endIntervalID} with collect statistics set to ${collectStatisticsParam}")
        print("View results on the SQL Server Performance Report Page or download it here.")
        confirmRunLevelMaintenance()
        pid = api.submitSqlServerPerfReportWithQueryStoreBatchJob(collectStatisticsParam, beginIntervalID, endIntervalID)
      }
      print("SQL Server Performance Report batch job is being run with PID ${pid.Pid}")
    } catch (e: ServerStateException) {
      print("Unable to submit job.  Reason: ${e.Message}")
    }
  }
} else if( SystemToolsArgs.AwrSnapshots != null ) {
  if( SystemToolsArgs.AwrSnapshots.length != 1 ) {
    print( "Please specify one argument to AwrSnapshots, the number of most recent AWR snapshots to display." )
  } else {
    var numSnapshots : int;
    var argError = false
    try {
      numSnapshots = Integer.parseInt(SystemToolsArgs.AwrSnapshots[0])
    } catch ( e ) {
      argError = true
      print( "First argument to AwrSnapshots, '${SystemToolsArgs.AwrSnapshots[0]}', is not a number." )
    }
    if (!argError) {
      try {
        confirmRunLevelMaintenance()
        var databaseSnapshotInfos = api.getRecentAWRSnapshotInfo(numSnapshots)
        if (databaseSnapshotInfos.length == 0) {
          print( "No AWR snapshots found." )
        } else {
          print( "${numSnapshots} most recent AWR snapshots" )
          for( snapshot in databaseSnapshotInfos ) {
            print("ID=${snapshot.Id}, SnapTime=${snapshot.SnapTime}, InstanceStartupTime=${snapshot.StartupTime}")
          }
        }
      } catch ( e ) {
        print ( "Unable to get snapshots.  Reason: ${e.Message}" )
      }
    }
  }
} else if( SystemToolsArgs.RunAwrReport != null ) {
  if( SystemToolsArgs.RunAwrReport.length != 3 ||
      SystemToolsArgs.RunAwrReport.length == 1 &&
        (SystemToolsArgs.RunAwrReport[0].equals("help") || SystemToolsArgs.RunAwrReport[0].equals("?")) ) {
    print( "Please specify three arguments to OracleAWRPerfReport:  beginSnapId, endSnapId, probeV$tables(true/false)" )
    print( "   or beginSnapId, endSnapId, @fn.properties" )
    print( "If using properties file, valid properties are:" )
    print( AWRReportUserSettingsFactory.SystemToolsPropertiesHelpMsg )
  } else {
    var beginSnapId : int
    var snapIdArgError = false
    try {
      beginSnapId = Integer.parseInt(SystemToolsArgs.RunAwrReport[0])
    } catch ( e ) {
      snapIdArgError = true
      print( "First argument, '${SystemToolsArgs.RunAwrReport[0]}', is not a number." )
    }
    var endSnapId : int
    try {
      endSnapId = Integer.parseInt(SystemToolsArgs.RunAwrReport[1])
    } catch ( e ) {
      snapIdArgError = true
      print( "Second argument, '${SystemToolsArgs.RunAwrReport[1]}', is not a number. ")
    }
    if( beginSnapId == endSnapId ) {
      snapIdArgError = true
      print( "First and second arguments, '${SystemToolsArgs.RunAwrReport[1]}', must be different numbers. " )
    } else if ( beginSnapId > endSnapId ) {  // reverse if backwards
      var saveBeginSnapId = beginSnapId
      beginSnapId = endSnapId
      endSnapId = saveBeginSnapId
    }
    if( !snapIdArgError ) {
      var pid : ProcessID
      var awrReportUserSettings : AWRReportUserSettings
      if (SystemToolsArgs.RunAwrReport[2].startsWith("@")) {
        try {
          awrReportUserSettings = ToolkitUtils.readAWRRunParams(SystemToolsArgs.RunAwrReport[2].substring(1))
         } catch (e) {
          print( "Could not finish AWR report: ${e.Message}" )
            java.lang.System.exit(5)
         }
      } else {
        awrReportUserSettings = ToolkitUtils.createAWRReportUserSettings( new AWRReportUserSettingsFactory() )
        awrReportUserSettings.ProbeVDollarTables = parseBoolean(SystemToolsArgs.RunAwrReport[2])
      }
      var awrReportUserSettingsFactory = ToolkitUtils.getAWRReportUserSettingsFactory(awrReportUserSettings)
      var errors = awrReportUserSettingsFactory.validateAWRParams()
      if( errors.length > 0 ) {
        print( "Param settings are: " + awrReportUserSettingsFactory.BooleanSettingsString)
        print( "Errors found in param settings:\n" )
        for( error in errors ) {
          print( error )
        }
      } else {
        awrReportUserSettings.BeginSnapId = beginSnapId
        awrReportUserSettings.EndSnapId = endSnapId
        print( "Submitting Oracle AWR Performance Report between snapshots " +
            Integer.toString(awrReportUserSettings.BeginSnapId) + " and " + Integer.toString(awrReportUserSettings.EndSnapId) +
            " and arguments:\n" + awrReportUserSettingsFactory.BooleanSettingsString )
        try {
          confirmRunLevelMaintenance()
          pid = api.submitAwrReportBatchJob(awrReportUserSettings)
          print( "Oracle AWR Performance Report batch job is being run with PID ${pid.Pid}" )
          print("View results on the Oracle AWR Information Server Tools Info Page or download it here." )
        } catch (e : ServerStateException) {
          print ( "Unable to submit job.  Reason: ${e.Message}" )
        }
      }
    }
  }
} else if (SystemToolsArgs.ListPerfReports != null) {
  var numDownloads : int;
  if (SystemToolsArgs.ListPerfReports.length != 0 && SystemToolsArgs.ListPerfReports.length != 1) {
     print( "Please specify zero or one arguments to listPerfReports, the number of most recent database perf reports to display, "
        + "with the default of all." )
  } else {
    var argError = false
    if (SystemToolsArgs.ListPerfReports.length == 0) {
      numDownloads = 0;
    } else {
      try {
        numDownloads = Integer.parseInt(SystemToolsArgs.ListPerfReports[0])
      } catch (e : NumberFormatException) {
        argError = true
        print("First argument to ListOraDownloads, '${SystemToolsArgs.ListPerfReports[0]}', is not a number.")
      }
    }
    if (!argError) {
      try {
        confirmRunLevelMaintenance()
        var perfDownloadDetails = api.getPerfReportsInfo(numDownloads)
        if (perfDownloadDetails.length == 0) {
          print( "No database performance download found." )
        } else {
          print( "Most recent database performance downloads" )
          for (perfDownloadDetail in perfDownloadDetails) {
            print (perfDownloadDetail)
          }
        }
      } catch (e) {
        print ("Unable to get download info.  Reason: ${e.Message}")
      }
    }
  }
} else if( SystemToolsArgs.DownloadPerfReport != null ) {
   if( SystemToolsArgs.DownloadPerfReport.length != 1 ) {
     print( "Please specify one argument to getPerfReport, the ID of the report to download." )
   } else {
     var reportID = SystemToolsArgs.DownloadPerfReport[0];
     var filePath =  SystemToolsArgs.FilePath == null ? "." : SystemToolsArgs.FilePath
     var bytes = api.getPerfReport(reportID)

     writeZipFile(bytes, "DbPerfReport", filePath )
   }
 } else if( SystemToolsArgs.GetDBStatisticsStatements ) {
  confirmRunLevelMaintenance()
  for( data in api.getUpdateTableStatisticsData() ) {
    var updateStmts = data.StatisticsUpdateStatements.Entry.join(";\n")
    print( "--<%=data.TableName%>\n ${updateStmts}\n" )
  }
 } else if( SystemToolsArgs.GetIncrementalDBStatisticsStatements ) {
  confirmRunLevelMaintenance()
  for( data in api.getIncrementalUpdateTableStatisticsData() ) {
    var updateStmts = data.StatisticsUpdateStatements.Entry.join(";\n")
    print( "--<%=data.TableName%>\n ${updateStmts}\n" )
  }
 } else if( SystemToolsArgs.ReportDBStats != null ) {
  //Report DB Statistics
  var filePath =  SystemToolsArgs.FilePath == null ? "." : SystemToolsArgs.FilePath
  if ( SystemToolsArgs.ReportDBStats.length == 0 ) {
    print("Generating and reporting database statistics for all database tables from '${SystemToolsArgs.Server}'; this may take a while");
    printDBStatsCommandLineArgs(null, null, null)
    confirmRunLevelMaintenance()
    var bytes = api.reportPartialDatabaseCatalogStatistics(null, null, null)
    writeZipFile(bytes, "DBCatalogStatistics", filePath )
  } else if( SystemToolsArgs.ReportDBStats.length != 3 ) {
    print("Please specify a table selection, a staging table selection and a typelist table selection");
  } else {
    print("Generating and reporting database statistics for selected database tables from '${SystemToolsArgs.Server}'; this may take a while")
    var tables = convertCommandLineArg( SystemToolsArgs.ReportDBStats[0] )
    var stagingTables = convertCommandLineArg( SystemToolsArgs.ReportDBStats[1] )
    var typelistTables = convertCommandLineArg( SystemToolsArgs.ReportDBStats[2] )
    confirmRunLevelMaintenance()
    var bytes = api.reportPartialDatabaseCatalogStatistics(tables, stagingTables, typelistTables)
    writeZipFile(bytes, "DBCatalogStatistics", filePath );
  }
} else if( SystemToolsArgs.Version ) {
    confirmRunLevelMaintenance()
    var version = api.getVersion()
    if (version == null) {
      print("Server '${SystemToolsArgs.Server}' is not ready")
      return
    }
    print("")
    print("Server:                  ${SystemToolsAPI.ADDRESS}")
    print("Product version:         ${version.AppVersion}")
    print("Database schema version: ${version.SchemaVersion}")
} else if ( SystemToolsArgs.Maintenance ) {
  //Runlevel stuff
  try {
    confirmRunLevelMaintenance()
    api.setRunlevel(MAINTENANCE)
    print("Server in maintenance mode")
  } catch (e) {
    print( "Unable to switch server to maintenance mode.  Reason: ${e.Message}")
  }
} else if ( SystemToolsArgs.Daemons ) {
  try {
    confirmRunLevelMaintenance()
    api.setRunlevel(DAEMONS)
    print("Server in daemons mode")
  } catch (e) {
    print( "Unable to switch server to daemons mode.  Reason: ${e.Message}")
  }
} else if ( SystemToolsArgs.MultiUser ) {
  try {
    confirmRunLevelMaintenance()
    api.setRunlevel( MULTIUSER )
    print("Server in multiuser mode")
  } catch (e) {
    print( "Unable to switch server to multiuser mode.  Reason: ${e.Message}")
  }
} else if ( SystemToolsArgs.SessionInfo ) {
  //Show session information
  confirmRunLevelMaintenance()
  var activeSessionData = api.getActiveSessionData()

  //partition sessions on user name
  var userNameToSessions = activeSessionData.partition( \ s -> s.UserName == null ? "Temporary system user" : s.UserName   )

  //collapse to count of user names
  var userNameToCount = userNameToSessions.mapValues( \ l -> l.Count )

  //sort entries by count
  var entriesSortedByCount = userNameToCount.entrySet().toList().sortByDescending( \ m -> m.Value  )

  //print out each username and the number of sessions they have
  print( "${activeSessionData.length} active sessions:" )
  for( entry in entriesSortedByCount ) {
    print( "${entry.Key} - ${entry.Value}" )
  }
} else if ( SystemToolsArgs.DeactivateUsername != null ) {
  try {
    if (!api.deactivateUser( SystemToolsArgs.DeactivateUsername )) {
      print( "User ${SystemToolsArgs.DeactivateUsername} was already deactivated.")
    }
  } catch (e) {
    print( "Unable to deactivate user ${SystemToolsArgs.DeactivateUsername}.  Reason: ${e.Message}")
  }
} else if( SystemToolsArgs.UpdateLoggingLevel != null ) {
  //Update the logging level of the server
  if( SystemToolsArgs.UpdateLoggingLevel.length != 2 ) {
    print( "Please specify both a logger and a new logging level")
  } else {
    confirmRunLevelMaintenance()
    api.updateLoggingLevel(SystemToolsArgs.UpdateLoggingLevel[0], SystemOutLogger_LoggingLevel.forGosuValue( SystemToolsArgs.UpdateLoggingLevel[1] ))
  }
} else if( SystemToolsArgs.LoggerCategories ) {
  confirmRunLevelMaintenance()
  //Show all logger categories on the server
  api.getLoggingCategories().each(\s -> print(s))
} else if( SystemToolsArgs.ReloadLoggingConfig ) {
  //Reload the logging configuration
  print( "Reloading logging config..." )
  api.reloadLoggingConfig()
  print( "Logger configuration reloaded" )
} else if ( SystemToolsArgs.VerifyDBSchema ) {
  print("Verify the data model matches the physical database of server at '${SystemToolsArgs.Server}'; this may take a few minutes");
  confirmRunLevelMaintenance()
  var diffs = api.verifyDatabaseSchema()
  if (diffs.length != 0) {
    print("Inconsistencies detected!");
    diffs.each( \ s -> print( s )  )
  } else {
    print("No inconsistencies found");
  }
} else if ( SystemToolsArgs.VerifyConfig != null ) {
  var supportedUpgrades = Arrays.asList(RequestedUpgrade.values())
  if ( SystemToolsArgs.VerifyConfig.length < 1 ) {
    print("Please specify path to WAR/EAR file and optional requested updrade " + supportedUpgrades)
  } else {
    print("Using remote ExternalConfigurationProviderPlugin to resolve local configuration substitution if present.");
    var pairFactory = FilenameDigestPairFactory.createFactory(SystemToolsArgs.VerifyConfig[0])
    var requestedUpgrade = RequestedUpgrade.BLUE_GREEN_UPGRADE; // default
    if (SystemToolsArgs.VerifyConfig.length == 2) {
      requestedUpgrade = RequestedUpgrade.forValue(SystemToolsArgs.VerifyConfig[1].toUpperCase())
    }

    if (requestedUpgrade == null) {
      print("Please specify correct requested updrade value selected from " + supportedUpgrades)
    } else {
      var wsPairs = createWsPairs(pairFactory);
      var reportOptions = new VerifyConfigReportOptions()
      reportOptions.setShowDetails(SystemToolsArgs.ShowDetails)
      confirmRunLevelMaintenance()
      print(api.verifyConfigUsingRemoteExtCfg(requestedUpgrade, pairFactory.AppVerifiersConfigFP, pairFactory.PlVerifiersConfigFP, wsPairs, reportOptions));
    }
  }
} else if ( SystemToolsArgs.StartFullUpgrade ) {
  print("Setting the intention to perform a FULL upgrade")
  confirmRunLevelMaintenance()
  api.startFullUpgrade()
} else if (SystemToolsArgs.ClusterNodes) {
  confirmRunLevelMaintenance()
  var clusterState = api.getClusterState()
  ToolkitUtils.printTable(
      {
        "Server Id", "In Cluster", "Runlevel", "Started", "Last Update Time",
        "User Sessions", "Planned Shutdown Initiated", "Planned Shutdown Time", "Bg. Tasks Stopped"
      },
      clusterState.Members.Entry.map( \ m -> {
        return {
          m.ServerId, m.InCluster ? "yes" : "no", m.Runlevel?.name(), formatDate(m.ServerStarted), formatDate(m.LastUpdateTime),
          m.UserSessions as String, formatDate(m.PlannedShutdownInitiated), formatDate(m.PlannedShutdownTime), formatDate(m.BgTasksStopped)
        }
      })
  )
} else if (SystemToolsArgs.ClusterComponents) {
  confirmRunLevelMaintenance()
  var clusterState = api.getClusterState()
  var active = clusterState.Members.Entry.flatMap(\e -> e.Components.Entry*.$TypeInstance.toList())
  var allComponents = active.concat(clusterState.UnassignedComponents.Entry*.$TypeInstance.toList())
  var sorted = allComponents.orderBy( \ c -> c.Type.name()).thenBy( \ c -> c.Code)
  ToolkitUtils.printTable(
      {"Type", "Code", "State", "Started", "Server Id", "Component Id"},
      allComponents.map(\c -> {
        return {c.Type.name(), c.Code, c.State.name(), formatDate(c.Started), c.ServerId, c.UniqueId}
      })
  )
} else if (SystemToolsArgs.NodeFailed != null) {
  confirmRunLevelMaintenance()
  api.nodeFailed(SystemToolsArgs.NodeFailed, SystemToolsArgs.EvenIfInCluster)
} else if (SystemToolsArgs.EvenIfInCluster) {
  print("The parameter can only be used with -nodefailed")
} else if (SystemToolsArgs.CompleteFailedFailover != null) {
  if( SystemToolsArgs.CompleteFailedFailover.length != 2 ) {
    print( "Please specify both type and componentId")
  } else {
    confirmRunLevelMaintenance()
    api.completeFailedFailover(ComponentType.valueOf(SystemToolsArgs.CompleteFailedFailover[0]), SystemToolsArgs.CompleteFailedFailover[1])
  }
} else if (SystemToolsArgs.RequestComponentTransfer != null) {
  if( SystemToolsArgs.RequestComponentTransfer.length != 3 ) {
    print( "Please specify type, componentId, and targetOwner")
  } else {
    confirmRunLevelMaintenance()
    api.requestComponentTransfer(ComponentType.valueOf(SystemToolsArgs.RequestComponentTransfer[0]),
        SystemToolsArgs.RequestComponentTransfer[1], SystemToolsArgs.RequestComponentTransfer[2])
  }
} else if (SystemToolsArgs.ScheduleShutdown != null) {
  var serverId = SystemToolsArgs.ScheduleShutdown
  var options = new ShutdownOptions()
  options.TerminateBatchProcesses = SystemToolsArgs.TerminateBatchProcesses
  options.ShutdownTime = new Date().addMinutes(SystemToolsArgs.ShutdownDelayMinutes)
  options.ShutdownMessageDisplayKey = "Web.TabBar.SystemAlertBar.PlannedShutdown.ScaleInMessage"
  print("Scheduling ${serverId} shutdown at ${options.ShutdownTime}...")
  confirmRunLevelMaintenance()
  var ok = api.scheduleShutdown(serverId, options)
  if (!ok) {
    print("Error: the shutdown has already been scheduled")
  }
} else if (SystemToolsArgs.CancelShutdown != null) {
  var serverId = SystemToolsArgs.CancelShutdown
  print("Cancelling ${serverId} shutdown...")
  confirmRunLevelMaintenance()
  var ok = api.cancelShutdown(serverId)
  if (!ok) {
    print("Error: no shutdown to cancel")
  }
} else {
  CommandLineAccess.showHelp( SystemToolsArgs )
}

print( "done" )
java.lang.System.exit(0)

//==============================================================================
// Helper functions
//==============================================================================

function createWsPairs(pairFactory: FilenameDigestPairFactory) : FilenameDigestPair[] {
  var regularPairs = pairFactory.createPairs()
  var wsPairs = new FilenameDigestPair[regularPairs.length]
  for (pair in regularPairs index i) {
    wsPairs[i] = new FilenameDigestPair()
    wsPairs[i].Filename = pair.Filename
    wsPairs[i].Digest = pair.Digest
  }
  return wsPairs;
}

function convertCommandLineArg( commandLineArg : String ) : String[] {
  var args : String[]
  if (commandLineArg.equalsIgnoreCase("all")) {
    // null is the return value
  } else if (commandLineArg.equalsIgnoreCase("none")) {
    args = {}
  } else if (not commandLineArg.startsWith("@")) { // single table
    args = {commandLineArg};
  } else { // file of table names
    var filename = commandLineArg.substring(1)
    args = ToolkitUtils.readSimpleCSV( filename )
  }
  return args;
}

function printCommandLineArgs( argsToCheck : String[] ) {
  if (argsToCheck == null) {
    print( "all" );
  } else if (argsToCheck.length == 0) {
    print( "none" );
  } else {
    print( argsToCheck.join( ", " ) )
  }
}

function printDBStatsCommandLineArgs(tablesToCheckArray : String[] , stagingTablesToCheckArray : String[] , typeListTablesToCheckArray : String[] ) {
  print("Running partial database statistics for tables: ")
  printCommandLineArgs(tablesToCheckArray)
  print("  and staging tables: ")
  printCommandLineArgs(stagingTablesToCheckArray)
  print("  and typelist tables: ")
  printCommandLineArgs(typeListTablesToCheckArray)
  print("")
}

function createZipFile(filename : String, filePath : String) : File {
  return createFile(filename, filePath, "zip")
}

function createTextFile(filename : String, filePath : String) : File {
  return createFile(filename, filePath, "txt")
}

function createFile(fileName : String, filePath : String, suffix : String) : File {
  if (filePath == null) {
    filePath = ".";
  }
  if (filePath.endsWith(File.separator)) {
    filePath = filePath.substring(0, filePath.length() - 1);
  }
  var date = new Date()
  var dateString = date.toString().replace(" ", "_").replace(":", ".")
  var fileToCreate = new File("${filePath}${File.separator}${fileName}_${dateString}.${suffix}")
  fileToCreate.ParentFile.mkdirs()
  return fileToCreate
}

function writeZipFile( bytes : byte[] , fileName : String, filePath : String ) {
  var zipFile = createZipFile(fileName, filePath)
  print( "Writing zip file ${zipFile.toString()}" )
  try {
    zipFile.writeBytes( bytes )
    print( "Done writing file ${zipFile.toString()}" )
  } catch( e ) {
    print( "Could not write file ${zipFile.toString()}" )
    print( e.Message )
    e.printStackTrace()
  }
}

function formatDate( date : Date) : String {
  return date != null ? DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(date) : null
}

function confirmRunLevelMaintenance(){
  var errorMessage = "The server must be at MAINTENANCE runlevel or greater in order to use system tool operations."
  ServerRunLevelVerifier.confirmRunLevelMaintenance(SystemToolsArgs.Server, SystemToolsArgs.User, SystemToolsArgs.Password, errorMessage)
}

function parseBoolean(str: String) : boolean {
  if (Boolean.parseBoolean(str)) {
    return true
  } else if (str != "false") {
    throw "Please specify true or false, not " + str
  }
  return false;
}
