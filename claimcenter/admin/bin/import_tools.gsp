uses gw.cmdline.util.*
uses gw.wsi.pl.importtoolsapi.ImportToolsAPI
uses gw.wsi.pl.importtoolsapi.types.complex.ImportResults
uses java.lang.StringBuilder

uses gw.lang.cli.CommandLineAccess
uses java.lang.Integer
uses java.util.ArrayList
uses java.io.File
uses java.lang.System
uses gw.xml.SimpleXMLNodeFactory
uses gw.xml.XMLNode
uses java.io.FileOutputStream
uses java.io.FileInputStream
uses java.io.OutputStreamWriter
uses java.io.InputStreamReader
uses gw.util.StreamUtil

function isWrongXMLContent(results : ImportResults) : boolean {
  return !results.Ok && results.Summaries == null
}

function formatDuration(millis : long) : String {
  if(millis < 0) {
    millis = -millis
  }
  var secs = millis / 1000
  var mins = (secs / 60) % 60
  var hrs = (secs / 3600) % 24
  var days = secs / (3600 * 24)
  secs = secs % 60
  var buf = new StringBuilder()
  if(days > 0) {
    buf.append(days).append(days > 1 ? " days " : " day ")
  }
  if(hrs > 0) {
    buf.append(hrs).append(hrs > 1 ? " hours " : " hour ")
  }
  if(mins > 0) {
    buf.append(mins).append(mins > 1 ? " minutes " : " minute ")
  }
  buf.append(secs).append(secs != 1 ? " seconds" : " second")
  if(millis < 1000) {
    buf.append(" [${millis} ms]")
  }
  return buf.toString()
}

function printResults(results : ImportResults, duration : long) {
  print("")
  if(!results.Ok) {
    print("Import failed; the following errors occurred:")
    results.ErrorLog.Entry.each(\e -> print(e))
  } else {
    print("Import succeeded")
    print("Total time: ${formatDuration(duration)}")
    print("Parse time: ${formatDuration(results.ParseTime)}")
    print("Write time: ${formatDuration(results.WriteTime)}")
    print("")
    if(results.ErrorLog.Entry.Count > 0) {
      print("The following errors occurred:")
      results.ErrorLog.Entry.each(\e -> print(e))
    } else {
      print("No errors occurred.")
    }
      print("The following entities were imported:")
      results.Summaries.Entry.each(\s -> print("${s.Type == 0 ? "Inserted" : "Updated"} ${s.Count} ${s.EntityName}"))
  }
  print("")
}

function confirmRunLevelMaintenance() {
  var errorMessage = "The server must be at MAINTENANCE runlevel or greater in order to use import tool operations."
  ServerRunLevelVerifier.confirmRunLevelMaintenance(ImportToolsArgs.Server, ImportToolsArgs.User, ImportToolsArgs.Password, errorMessage)
}
print( "Running ${Gosu.getCurrentProgram().Name}" )

//Initialize the args class for this program
CommandLineAccess.initialize( ImportToolsArgs )

ImportToolsArgs.User = ToolkitUtils.getFromConsole("User:", ImportToolsArgs.User)
ImportToolsArgs.Password = ToolkitUtils.getFromConsole("Password:", ImportToolsArgs.Password)
var config = ToolkitUtils.initConfig("/ws/gw/wsi/pl/ImportToolsAPI",
    ImportToolsArgs.Server,
    ImportToolsArgs.User,
    ImportToolsArgs.Password);
config.CallTimeout = Integer.MAX_VALUE
var api = new ImportToolsAPI( config );
print( "Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}" )

var charSetName = "UTF-8"

if(ImportToolsArgs.Charset != null) {
  charSetName = ImportToolsArgs.Charset
}

if(ImportToolsArgs.Import != null) {
  var fileNamesToImport = new ArrayList<String>()
  var filenames = ImportToolsArgs.Import.split( "," ).map( \ s -> s.trim() )
  for(filename in filenames) {
    if(filename.startsWith( "@" )) {
      var fileList = new File(filename.substring(1))
      if(!fileList.exists()) {
        print("File ${fileList.AbsolutePath} does not exist")
        System.exit( -1 )
      }
      fileList.eachLine( \ listFileName -> {
        if(!listFileName.startsWith( "#" )) {
          var listFile = new File(listFileName)
          if(!listFile.exists()) {
            listFile = new File(fileList.ParentFile, listFileName)
          }
          fileNamesToImport.add(listFile.AbsolutePath)        
        }
      } )
    } else if(filename.endsWith( ".lst" )) {
      // see http://jira/jira/browse/CC-17642
      print("You can provide a file that contains the list of files by prepending the file name with an @ sign. E.g. -import @#{filename}");
    } else {
      fileNamesToImport.add(filename)
    }
  }
  
  for(filename in fileNamesToImport) {
    print("Importing \"${filename}\"...")
    var t1 = System.currentTimeMillis()
    var file = new File(filename)
    var size = file.length()
    if(size > Integer.MAX_VALUE) {
      throw "Cannot import a file more than ${Integer.MAX_VALUE} bytes."
    }
    var importData : String
    if(filename.endsWith( ".csv" )) {
      var fileReader = new InputStreamReader( new FileInputStream( file ), charSetName )
      importData = StreamUtil.getContent( fileReader )
    } else {
      importData = XMLNode.parse( file ).asUTFString()
    }      
    
    if(ImportToolsArgs.OutputCsv != null) {
      confirmRunLevelMaintenance()
      var csv = api.xmlToCsv(importData)
      var fileWriter = new OutputStreamWriter(new FileOutputStream(ImportToolsArgs.OutputCsv), charSetName)
      fileWriter.write(csv)
      fileWriter.close()
    } else if(ImportToolsArgs.OutputXml != null) {
      if(filename.endsWith( ".csv" )) {
        var dataset = ImportToolsArgs.Dataset == null ? -1 : Integer.parseInt(ImportToolsArgs.Dataset)
        confirmRunLevelMaintenance()
        importData = api.csvToXml(importData, dataset, ImportToolsArgs.IgnoreNullViolations, ImportToolsArgs.IgnoreAllErrors)
      }
      var fileWriter = new OutputStreamWriter(new FileOutputStream(ImportToolsArgs.OutputXml), charSetName)
      fileWriter.write(importData)
      fileWriter.close()
    } else {
      var results : Object
      if(filename.endsWith( ".csv" )) {
        var dataset = ImportToolsArgs.Dataset == null ? -1 : Integer.parseInt(ImportToolsArgs.Dataset)
        confirmRunLevelMaintenance()
        results = api.importCsvData(importData, dataset, ImportToolsArgs.IgnoreNullViolations, ImportToolsArgs.IgnoreAllErrors)
      } else {
        confirmRunLevelMaintenance()
        results = api.importXmlData(importData)
      }
      var t2 = System.currentTimeMillis()
      if(isWrongXMLContent(results as ImportResults)) {
        // see http://jira/jira/browse/CC-17639
        print("There is no expected data in the xml files.")
      } else {
        printResults(results as ImportResults, t2 - t1)
      }
    }
  }
} else if(ImportToolsArgs.Privileges) {
  print("Rebuilding role privileges")
  confirmRunLevelMaintenance()
  api.rebuildRolePrivileges()
} else {
  CommandLineAccess.showHelp( ImportToolsArgs )
}

print( "done" )