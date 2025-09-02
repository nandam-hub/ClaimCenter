uses java.nio.file.Paths

uses java.nio.file.Path

uses java.nio.file.Files

uses gw.lang.cli.CommandLineAccess
uses gw.cmdline.util.MaintenanceToolsArgs
uses gw.cmdline.util.CCToolkitUtils
uses java.util.HashSet
uses java.io.File
uses java.text.SimpleDateFormat
uses java.util.ArrayList
uses gw.cmdline.util.ToolkitUtils
uses java.lang.Throwable
uses java.util.Date
uses java.net.URL
uses gw.webservice.cc.maintenancetoolsapi.MaintenanceToolsAPI
uses gw.webservice.cc.maintenancetoolsapi.types.complex.ProcessID

function formatDateTime(d : Date) : String {
  if (d == null) {
    return "N/A"
  }
  var dateTimeFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")
  return dateTimeFormat.format(d)
}

print( "Running ${Gosu.getCurrentProgram().Name}" )

//Initialize the args class for this program
CommandLineAccess.initialize( MaintenanceToolsArgs )

//New up a maintenance soap service
var config = new gw.xml.ws.WsdlConfig()
config.ServerOverrideUrl = new URL(MaintenanceToolsArgs.Server + "/ws/gw/webservice/cc/MaintenanceToolsAPI").toURI() as String
config.Guidewire.Authentication.Username = MaintenanceToolsArgs.User
config.Guidewire.Authentication.Password = MaintenanceToolsArgs.Password
var api = new MaintenanceToolsAPI( config );
print( "Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}" )

//If start process was passed in, fire it off
if( MaintenanceToolsArgs.StartProcess != null ) {
  var process = MaintenanceToolsArgs.StartProcess
  print( "Running process '${process}'" )
  if( validateProcessName( process ) ) {
    var pid : ProcessID
    if (MaintenanceToolsArgs.Arguments != null && MaintenanceToolsArgs.Arguments.length > 0) {
      print( "${MaintenanceToolsArgs.Arguments.toList().size()} Arguments: ${MaintenanceToolsArgs.Arguments.toList()}" )
      pid = api.startBatchProcessWithArguments( process, MaintenanceToolsArgs.Arguments )
    } else if (MaintenanceToolsArgs.File!=null && !MaintenanceToolsArgs.File.isEmpty()) {
      print("From file: ${MaintenanceToolsArgs.File}")
      var args = Files.readAllLines(Paths.get(new File(MaintenanceToolsArgs.File).toURI()))
      pid = api.startBatchProcessWithArguments(process, args.toArray(new String[0]))
    } else {
      pid = api.startBatchProcess( process )
    }
    print( "Process '${process}' is being run with PID ${pid.Pid}" )
    print( "Please consult application LOG for possible error messages.")
  }
}

//if process status was passed in, fire it off
else if( MaintenanceToolsArgs.ProcessStatus != null ) {
  var nameOrId = MaintenanceToolsArgs.ProcessStatus

  //number passed in
  if( nameOrId.matches( "\\b\\d+\\b" ) ) {
    var pid = new ProcessID()
    pid.Pid = nameOrId.toLong()

    try {
      var status = api.batchProcessStatusByID( pid )

      print( "Process number ${nameOrId} (${status.Type}):" )

      if (status.Starting) {
        print( "Currently starting" )
      } else if( status.Executing ) {
        print( "Currently running, started at ${formatDateTime(status.StartDate)}, completed ${status.OpsCompleted} operation(s) with ${status.FailedOps} failure(s)" );
        if( status.DetailedStatus != null ) {
          print( "Detailed status: ${status.DetailedStatus}" )
        }
      } else {
        print("Started at ${formatDateTime(status.StartDate)}, completed at ${formatDateTime(status.DateCompleted)}")
        if (status.getSuccess()) {
          print("Ran to completion, completing ${status.OpsCompleted} operation(s) with ${status.FailedOps} failure(s)");
        } else {
          print( "Failed to run to completion: ${status.FailureReason}. Completed ${status.OpsCompleted} operation(s) " +
                 "with ${status.FailedOps } failure(s) before terminating" )
        }
      }
    } catch ( e ) {
      print( "Failed to find process status: " + e.Message )
    }
  }

  else { //name passed in
    if ( validateProcessName (nameOrId ) ) {
      var status = api.batchProcessStatusByName(nameOrId)
      print("Process ${nameOrId}:");

      if (status.Starting) {
        print( "Currently starting" )
      } else if( status.Executing ) {
        print("Process ${nameOrId} is currently running with ${status.OpsCompleted} operation(s) completed and ${status.FailedOps} failure(s) so far")
        if (status.DetailedStatus != null) {
          print( "Detailed status: ${status.DetailedStatus}" )
        }
      } else {
        print("Process ${nameOrId} is not currently running. To view completion status of a particular process instance, please provide the process ID.");
      }
    }
  }
}

else if( MaintenanceToolsArgs.TerminateProcess != null ){
  var nameOrId = MaintenanceToolsArgs.TerminateProcess

  //number passed in
  if( nameOrId.matches( "\\b\\d+\\b" ) ) {
    var pid = new ProcessID()
    pid.Pid = nameOrId.toLong()

    try {
      if( api.requestTerminationOfBatchProcessByID( pid ) ) {
        print( "Terminated process number ${nameOrId}" );
      } else {
        print( "Process ${nameOrId} couldn't be terminated or isn't currently running." )
      }
    } catch ( e ) {
      print ("Failed to terminate process: ${e.LocalizedMessage}" )
    }

  //name passed in
  } else {
    if ( validateProcessName (nameOrId ) ) {
      if( api.requestTerminationOfBatchProcessByName( nameOrId ) ) {
        print( "Terminated process ${nameOrId}" );
      } else {
        print( "Process ${nameOrId} couldn't be terminated or isn't currently running." )
      }
    }
  }
}

else if( MaintenanceToolsArgs.WhenStats ) {
  var calcTime = api.whenStatsCalculated()
  var server = MaintenanceToolsArgs.Server
  if (calcTime == null) {
    print("Server on '${server}' has not calculated statistics")
  } else {
    print("Server on '${server}' calculated statistics at ${formatDateTime(calcTime)}")
  }
}

else if( MaintenanceToolsArgs.MarkClaimForPurge ) {
  if (MaintenanceToolsArgs.Claims != null) {
    print("Marking claims ${MaintenanceToolsArgs.Claims.join( ", " )} for purge")
    print(api.markPurgeReady(MaintenanceToolsArgs.Claims, MaintenanceToolsArgs.PurgeFromAggregateLimit))
  } else if( MaintenanceToolsArgs.File != null ) {
    print("Marking claims from file ${MaintenanceToolsArgs.File} for purge")
    print(api.markPurgeReady(ToolkitUtils.readSimpleCSV(MaintenanceToolsArgs.File), MaintenanceToolsArgs.PurgeFromAggregateLimit))
  } else {
    print("You must specify claim numbers via the -claims option or a CSV file to read via the -file option")
  }
}

else if( MaintenanceToolsArgs.RestoreClaim != null ) {
  var claimNumbers : String [] = null
  if( MaintenanceToolsArgs.Claims != null ) {
    print( "Restoring claims ${MaintenanceToolsArgs.Claims.join( ", " )} from archive" )
    claimNumbers = MaintenanceToolsArgs.Claims
  } else if( MaintenanceToolsArgs.File != null ) {
    print( "Restoring claims from file ${MaintenanceToolsArgs.File}" )
    claimNumbers = ToolkitUtils.readSimpleCSV( MaintenanceToolsArgs.File )
  }
  if(claimNumbers == null or claimNumbers.Count == 0) {
    print( "You must specify claim numbers via the -claims option or a CSV file to read via the -file option" )
  } else {
    claimNumbers = CCToolkitUtils.stripBlanks( claimNumbers )
    try {
      print( api.restore( claimNumbers, MaintenanceToolsArgs.RestoreClaim ) )
    } catch(t : Throwable) {
      print( "Error Processing Claims: ${t.LocalizedMessage}")
    }
  }
}

else if( MaintenanceToolsArgs.ScheduleClaimForArchive ) {
  var claimNumbers : String [] = null
  if( MaintenanceToolsArgs.Claims != null ) {
    print( "Scheduling claims ${MaintenanceToolsArgs.Claims.join( ", " )} for archive" )
    claimNumbers = MaintenanceToolsArgs.Claims
  } else if( MaintenanceToolsArgs.File != null ) {
    print( "Scheduling claims from file ${MaintenanceToolsArgs.File} for archive" )
    claimNumbers = ToolkitUtils.readSimpleCSV( MaintenanceToolsArgs.File )
  }
  if(claimNumbers == null or claimNumbers.Count == 0) {
    print( "You must specify claim numbers via the -claims option or a CSV file to read via the -file option" )
  } else {
    claimNumbers = CCToolkitUtils.stripBlanks( claimNumbers )
    try {
      print( api.scheduleForArchive( claimNumbers ) )
    } catch(t : Throwable) {
      print( "Error Processing Claims: ${t.LocalizedMessage}")
    }
    print( "Any claims listed as processed successfully have been scheduled for archive. Check the Work Queue Info and Info Pages for Archive to check the status of these claims." )
  }
} else if( MaintenanceToolsArgs.RebuildAggLimits ) {
  var claimNumbers : String [] = null
  var policyNumbers : String [] = null
  if( MaintenanceToolsArgs.Claims != null ) {
    print( "Rebuilding aggregate limits for claims ${MaintenanceToolsArgs.Claims.join( ", " )}" )
    claimNumbers = MaintenanceToolsArgs.Claims
  } else if( MaintenanceToolsArgs.File != null ) {
    print( "Rebuilding aggregate limits for claims from file ${MaintenanceToolsArgs.File}" )
    claimNumbers = ToolkitUtils.readSimpleCSV( MaintenanceToolsArgs.File )
  } else if( MaintenanceToolsArgs.Policies != null ) {
    print( "Rebuilding aggregate limits for policies ${MaintenanceToolsArgs.Policies.join( ", " )}" )
    policyNumbers = MaintenanceToolsArgs.Policies
  }
  if (MaintenanceToolsArgs.Policies != null and (MaintenanceToolsArgs.Claims != null or MaintenanceToolsArgs.File != null)) {
    print( "Only one of the -claims, -policies or -file options may be used at one time")
  } else {
    if (MaintenanceToolsArgs.ForceAll) {
      try {
        print( api.scheduleAggLimitRebuildAllLimits() )
      } catch (t : Throwable) {
        print("Error Rebuilding Aggregate Limits: ${t.LocalizedMessage}")
      }
    } else {
      if ((claimNumbers == null or claimNumbers.Count == 0) and (policyNumbers == null or policyNumbers.Count == 0)) {
        try {
          print( api.scheduleAggLimitRebuildInvalidLimits() )
        } catch (t : Throwable) {
          print("Error Rebuilding Aggregate Limits: ${t.LocalizedMessage}")
        }
      } else {
        //specifying claim numbers will take precedence over policy numbers.
        try {
          if (claimNumbers != null and claimNumbers.Count > 0) {
            claimNumbers = CCToolkitUtils.stripBlanks( claimNumbers )
            print( api.scheduleAggLimitRebuildOfClaims( claimNumbers ) )
          } else {
            policyNumbers = CCToolkitUtils.stripBlanks( policyNumbers )
            print( api.scheduleAggLimitRebuildOfPolicies( policyNumbers ) )
          }
        } catch(t : Throwable) {
          print( "Error Rebuilding Aggregate Limits for Claims: ${t.LocalizedMessage}")
        }
      }
    }
  }
} else if (MaintenanceToolsArgs.ChangeSubtypePublicID != null && MaintenanceToolsArgs.ChangeSubtypeTargetType != null) {
   print ("Changing subtype for contact with publicID: " + MaintenanceToolsArgs.ChangeSubtypePublicID + " to subtype: " +  MaintenanceToolsArgs.ChangeSubtypeTargetType)
  try {
    api.changeSubtype(MaintenanceToolsArgs.ChangeSubtypePublicID, MaintenanceToolsArgs.ChangeSubtypeTargetType)
  } catch ( e ) {
    print( "Failed to change contact to subtype: " + e.Message )
  }
} else {
  CommandLineAccess.showHelp( MaintenanceToolsArgs )
}


print( "done" )

function validateProcessName( process : String ) : boolean {
  if( not api.isBatchProcessNameValid(process) ) {
    var validNames = api.getValidBatchProcessNames().toList().sort().join( ", " )
    print( "'${process}' is not a valid process name. Valid names are: ${validNames}" )
    return false
  }
  return true
}
