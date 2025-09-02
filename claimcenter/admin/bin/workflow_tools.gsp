uses gw.cmdline.util.*
uses gw.lang.cli.CommandLineAccess
uses java.lang.Integer

uses gw.wsi.pl.workflowapi.WorkflowAPI
uses gw.wsi.pl.workflowapi.faults.BadIdentifierException
uses gw.wsi.pl.workflowapi.faults.EntityStateException
uses gw.wsi.pl.workflowapi.faults.IllegalArgumentException


print( "Running ${Gosu.getCurrentProgram().Name}" )

//Initialize the args class for this program
CommandLineAccess.initialize( WorkflowToolsArgs )

//New up a maintenance soap service
WorkflowToolsArgs.User = ToolkitUtils.getFromConsole("User:", WorkflowToolsArgs.User)
WorkflowToolsArgs.Password = ToolkitUtils.getFromConsole("Password:", WorkflowToolsArgs.Password)
var config = ToolkitUtils.initConfig("/ws/gw/wsi/pl/WorkflowAPI",
    WorkflowToolsArgs.Server, WorkflowToolsArgs.User, WorkflowToolsArgs.Password)
config.CallTimeout = Integer.MAX_VALUE
var api = new WorkflowAPI( config )
print( "Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}" )

try {
  if(WorkflowToolsArgs.ResumeAll) {
    confirmRunLevelMaintenance()
    api.resumeAllWorkflows()
  } else if(WorkflowToolsArgs.Resume != null) {
    confirmRunLevelMaintenance()
    api.resumeWorkflow( WorkflowToolsArgs.Resume )
  } else if(WorkflowToolsArgs.Complete != null) {
    confirmRunLevelMaintenance()
    api.complete( WorkflowToolsArgs.Complete )
  } else if(WorkflowToolsArgs.Suspend != null) {
    confirmRunLevelMaintenance()
    api.suspend( WorkflowToolsArgs.Suspend )
  } else {
    CommandLineAccess.showHelp( WorkflowToolsArgs )
  }
} catch (e : BadIdentifierException) {
  print("BadId: " + e.Message)
} catch (e : EntityStateException) {
  print("Workflow invalid state: " + e.Message)
} catch (e : IllegalArgumentException) {
  print("Required field: " + e.Message)
} catch (e) {
  e.printStackTrace()
}
print("done")

function confirmRunLevelMaintenance(){
  var errorMessage = "The server must be at MAINTENANCE runlevel or greater in order to use workflow tool operations."
  ServerRunLevelVerifier.confirmRunLevelMaintenance(WorkflowToolsArgs.Server, WorkflowToolsArgs.User, WorkflowToolsArgs.Password, errorMessage)
}