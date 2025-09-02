uses gw.cmdline.util.FNOLMapperArgs
uses gw.lang.cli.CommandLineAccess
uses gw.webservice.cc.cc5000.claim.claimapi.ClaimAPI
uses java.lang.Long
uses java.net.URI
uses java.io.File


print( "Running ${Gosu.getCurrentProgram().Name}" )

//Initialize the args class for this program
CommandLineAccess.initialize( FNOLMapperArgs )

//New up a maintenance soap service
var config = new gw.xml.ws.WsdlConfig()
config.CallTimeout = Long.MAX_VALUE
config.ServerOverrideUrl = new URI(FNOLMapperArgs.Server + "/ws/gw/webservice/cc/cc5000/claim/ClaimAPI") as String
config.Guidewire.Authentication.Username = FNOLMapperArgs.User
config.Guidewire.Authentication.Password = FNOLMapperArgs.Password
//set transaction header
var transactionIdHeader = new gw.xsd.guidewire.soapheaders.TransactionId()
transactionIdHeader.Value = java.util.UUID.randomUUID().toString()
config.RequestSoapHeaders.add(transactionIdHeader)

var api = new ClaimAPI(config)
print( "Connecting as ${config.Guidewire.Authentication.Username} to URL ${config.ServerOverrideUrl}" )
var result = api.importClaimFromXML(new File(FNOLMapperArgs.Input).read(), FNOLMapperArgs.Mapper)

if(FNOLMapperArgs.Resultfile != null) {
  new File(FNOLMapperArgs.Resultfile).write(result)
} else {
  print(result)
}
