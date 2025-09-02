package edge.Plugin.pcintegration.authorization

uses com.thetransactioncompany.jsonrpc2.client.ConnectionConfigurator
uses gw.xml.ws.WsdlConfig
uses wsi.remote.gw.webservice.pc.PCConfigurationProvider

uses java.net.HttpURLConnection
uses org.apache.commons.codec.binary.Base64

class EdgeBasicPCAuthenticator implements ConnectionConfigurator{

  override function configure(httpURLConnection: HttpURLConnection) {
    var wsdl = new WsdlConfig()
    new PCConfigurationProvider().configure(null, null, wsdl)

    var username = wsdl.Guidewire.Authentication.Username
    var password = wsdl.Guidewire.Authentication.Password
    var up = username.concat(":" + password).getBytes()
    var auth = Base64.encodeBase64(up)
    httpURLConnection.addRequestProperty("Authorization", "Basic " + new String(auth))
  }
}
