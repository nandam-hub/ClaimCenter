uses gw.cmdline.util.SystemToolsArgs
uses gw.cmdline.util.TableImportArgs
uses gw.cmdline.util.ToolkitUtils
uses gw.lang.cli.CommandLineAccess
uses gw.util.Base64Util
uses gw.util.StreamUtil
uses gw.wsi.pl.systemtoolsapi.SystemToolsAPI
uses gw.wsi.pl.systemtoolsapi.enums.SystemRunlevel
uses gw.wsi.pl.tableimportapi.TableImportAPI
uses gw.wsi.pl.tableimportapi.types.complex.TableImportResult

uses java.io.File
uses java.io.FileOutputStream
uses java.io.IOException
uses java.net.HttpURLConnection
uses java.net.URL
uses java.rmi.RemoteException

function printResults(tir : TableImportResult) {
  if(tir.NumErrors > 0) {
    print("Staging table integrity checking generated ${tir.NumErrors} load errors.")
  } else {
    print("Staging table integrity checking completed with no errors.")
  }
}

function getErrorMessage(e : RemoteException) : String {
  var msg = e.Message
  if(msg == null) {
    try {
        // Fix for CC-24600
        // Work around to get at a SOAPServerException message, which
        // is only stored in "message1" not "message"
      var getMsgMethod = e.Class.getMethod( "getMessage1", {} )
      msg = getMsgMethod.invoke(e, {}) as String
    } catch (e1 : Exception) {
      msg = null
    }
  }
  if(msg == null) {
    msg = e.toString()
  }
  return msg
}

function verifyRunLevelMaintenance() {
  var config2 = ToolkitUtils.initConfig("/ws/gw/wsi/pl/SystemToolsAPI", TableImportArgs.Server, TableImportArgs.User, TableImportArgs.Password)
  var sysApi = new SystemToolsAPI( config2 );
  var runlevel : SystemRunlevel
  try {
    runlevel = sysApi.getRunlevel()
  } catch (e : java.net.ConnectException) {
    print("Problem determining current run level: ${e.Message}")
  }

  if(SystemRunlevel.MAINTENANCE != runlevel) {
    if(!TableImportArgs.Encryptstagingtbls) {
      print("The server must be in maintenance mode to execute this staging table operation.")
      print("Please use \"system_tools.gsp -maintenance\" to change the server runlevel.")
      System.exit(-1)
    }
  }
}

function createZipFile(fileName : String, filePath : String) : File {
  if (filePath == null) {
    filePath = ".";
  }
  if (filePath.endsWith(File.separator)) {
    filePath = filePath.substring(0, filePath.length() - 1);
  }
  var date = new Date()
  var dateString = date.toString().replace(" ", "_").replace(":", ".")
  var suffix = "zip"
  return new File("${filePath}${File.separator}${fileName}_${dateString}.${suffix}")
}

print( "Running ${Gosu.getCurrentProgram().Name}" )

//Initialize the args class for this program
CommandLineAccess.initialize( TableImportArgs )

//New up a maintenance soap service
TableImportArgs.User = ToolkitUtils.getFromConsole("User:", TableImportArgs.User)
TableImportArgs.Password = ToolkitUtils.getFromConsole("Password:", TableImportArgs.Password)

var config = ToolkitUtils.initConfig("/ws/gw/wsi/pl/TableImportAPI", TableImportArgs.Server, TableImportArgs.User, TableImportArgs.Password)
config.CallTimeout = Integer.MAX_VALUE
var api = new TableImportAPI( config );
print("Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}")

if(TableImportArgs.Messagesinks != null) {
  print("WARNING: messagesinks is deprecated and has no effect")
}

if(TableImportArgs.Integritycheck || TableImportArgs.Integritycheckandload) {
  if(TableImportArgs.Integritycheck && TableImportArgs.Integritycheckandload) {
    print("Please specify either 'integritycheck' or 'integritycheckandload' but not both")
    System.exit(-1)
  }

  if(TableImportArgs.Zonedataonly && !TableImportArgs.Integritycheckandload) {
    print("'zonedataonly' only supported with 'integritycheckandload'")
    System.exit(-1)
  }

  if(TableImportArgs.Integritycheck) {
    verifyRunLevelMaintenance()

    if(TableImportArgs.Batch) {
      var pid = api.integrityCheckStagingTableContentsAsBatchProcess( TableImportArgs.Clearerror, TableImportArgs.Populateexclusion, TableImportArgs.Allreferencesallowed, TableImportArgs.Numthreadsintegritychecking )
      print("Staging table integrity checking started as process ${pid.Pid}")
    } else {
      var tir = api.integrityCheckStagingTableContents( TableImportArgs.Clearerror, TableImportArgs.Populateexclusion, TableImportArgs.Allreferencesallowed, TableImportArgs.Numthreadsintegritychecking )
      print("Staging table integrity checking completed...")
      printResults(tir)
    }
  } else if(TableImportArgs.Integritycheckandload) {    
    verifyRunLevelMaintenance()
    if(TableImportArgs.Batch) {
      if(TableImportArgs.Zonedataonly) {
        print("'zonedataonly' not supported with 'batch'")
        System.exit(-1)
      }

      var pid = api.integrityCheckStagingTableContentsAndLoadSourceTablesAsBatchProcess( TableImportArgs.Clearerror, TableImportArgs.Populateexclusion, TableImportArgs.Estimateorastats, TableImportArgs.Allreferencesallowed, TableImportArgs.Numthreadsintegritychecking )
      print("Staging table integrity checking / source table load started as process ${pid.Pid}")
    } else {
      try {
        var tir : TableImportResult
        if(TableImportArgs.Zonedataonly) {
          tir = api.integrityCheckZoneStagingTableContentsAndLoadZoneSourceTables( TableImportArgs.Clearerror, TableImportArgs.Populateexclusion, TableImportArgs.Estimateorastats, TableImportArgs.Numthreadsintegritychecking )
          print("Zone Staging table integrity checking / Zone source table load completed...")
        } else {
          tir = api.integrityCheckStagingTableContentsAndLoadSourceTables( TableImportArgs.Clearerror, TableImportArgs.Populateexclusion, TableImportArgs.Estimateorastats, TableImportArgs.Allreferencesallowed, TableImportArgs.Numthreadsintegritychecking )
          print("Staging table integrity checking / source table load completed...")
        }
        printResults(tir)
      } catch (e : RemoteException) {
        print("Staging table integrity checking failed: ${getErrorMessage(e)}")
      }
    }
  }
} else if(TableImportArgs.Clearerror) {
  if(TableImportArgs.Batch) {
    var pid = api.clearErrorTableAsBatchProcess()
    print("Clearing error table started as process ${pid.Pid}")
  } else {
    api.clearErrorTable()
    print("Error table cleared...")
  }
} else if(TableImportArgs.Clearexclusion) {
  if(TableImportArgs.Batch) {
    var pid = api.clearExclusionTableAsBatchProcess()
    print("Clearing exclusion table started as process ${pid.Pid}")
  } else {
    api.clearExclusionTable()
    print("Exclusion table cleared...")
  }
} else if(TableImportArgs.Clearstaging) {
  if(TableImportArgs.Batch) {
    var pid = api.clearStagingTablesAsBatchProcess()
    print("Clearing staging tables started as process ${pid.Pid}")
  } else {
    api.clearStagingTables()
    print("Staging tables cleared...")
  }
} else if(TableImportArgs.Deleteexcluded) {
  if(TableImportArgs.Batch) {
    var pid = api.deleteExcludedRowsFromStagingTablesAsBatchProcess()
    print("Excluded rows removal started as process ${pid.Pid}")
  } else {
    api.deleteExcludedRowsFromStagingTables()
    print("Excluded rows removed from staging tables...")
  }
} else if(TableImportArgs.Populateexclusion) {
  if(TableImportArgs.Batch) {
    var pid = api.populateExclusionTableAsBatchProcess()
    print("Exclusion table population started as process ${pid.Pid}")
  } else {
    api.populateExclusionTable()
    print("Exclusion table populated with rows to exclude...")
  }
} else if(TableImportArgs.Updatedatabasestatistics) {
  if(TableImportArgs.Batch) {
    var pid = api.updateStatisticsOnStagingTablesAsBatchProcess()
    print("Staging table database statistics update started as process ${pid.Pid}")
  } else {
    api.updateStatisticsOnStagingTables()
    print("Database statistics updated on the staging tables...")
  }
} else if(TableImportArgs.Encryptstagingtbls) {
  if (TableImportArgs.Batch) {
    var pid = api.encryptDataOnStagingTablesAsBatchProcess()
    print("Staging table encryption started as process ${pid.Pid}")
  } else {
    api.encryptDataOnStagingTables()
    print("Data encrypted on staging tables.")
  }
} else if(TableImportArgs.ListLoadHistoryReports != null) {
  var numDownloads : int;
  if (TableImportArgs.ListLoadHistoryReports.length != 0 && TableImportArgs.ListLoadHistoryReports.length != 1) {
     print( "Please specify zero or one arguments to listLoadHistoryReports, the number of most recent load history reports to display, "
        + "with the default of all." )
  } else {
    try {
      if (TableImportArgs.ListLoadHistoryReports.length == 0) {
        numDownloads = 0;
      } else {
        numDownloads = Integer.parseInt(TableImportArgs.ListLoadHistoryReports[0])
      }
      if (numDownloads < 0) {
        print ("Please specify a non-negatiuve number for the count of reports: ${numDownloads}")
      } else {
        var loadHistoryReportsInfo = api.getLoadHistoryReportsInfo(numDownloads)
        if (loadHistoryReportsInfo.length == 0) {
          print( "No load history download found." )
        } else {
          print( "Most recent load history downloads" )
          for (loadHistoryDownloadDetail in loadHistoryReportsInfo) {
            print (loadHistoryDownloadDetail)
          }
        }
      }
    } catch (nfe : NumberFormatException) {
      print("First argument to ListOraDownloads, '${TableImportArgs.ListLoadHistoryReports[0]}', is not a positive number.")
    } catch (e : Exception) {
      print ("Unable to get download info.  Reason: ${e.Message}")
    }
  }
} else if( TableImportArgs.DownloadLoadHistoryReport != null ) {
  if (TableImportArgs.DownloadLoadHistoryReport.length != 1 ) {
    print( "Please specify one argument to getLoadHistoryReport, the Public ID of the report to download." )
  } else {
    var reportID = TableImportArgs.DownloadLoadHistoryReport[0]
    var filePath =  SystemToolsArgs.FilePath == null ? "." : SystemToolsArgs.FilePath
    var bytes = api.getLoadHistoryReport(reportID)

    writeZipFile(bytes, "LoadHistoryReport", filePath )
  }
 } else {
  CommandLineAccess.showHelp( TableImportArgs )
}
print("done")

//==============================================================================
// Helper functions
//==============================================================================

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
