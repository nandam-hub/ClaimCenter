package edge.uaaoperations.uaaclient.dto

uses gw.api.util.ConfigAccess
uses java.util.Properties
uses java.io.BufferedInputStream
uses java.io.InputStreamReader
uses java.io.FileInputStream

class UaaClientConfigDTO {

  private static var UAA_CLIENT_CONFIG_PATH : String = "config/portal/uaaclientconfig.properties"

  construct(client: String) {

    var prefix = "${client}-"
    var clientConfigFile = ConfigAccess.getConfigFile(UAA_CLIENT_CONFIG_PATH)
    final var props = new Properties()
    using(var fi = new FileInputStream(clientConfigFile)) {
      using(var bi = new BufferedInputStream(fi)) {
        using(var reader = new InputStreamReader(bi, "UTF-8") ) {
          props.load(reader)
        }
      }
    }
    _clientId = props.getProperty("${prefix}clientId")
    _secret = props.getProperty("${prefix}secret")
  }

  var _clientId: String as ClientId

  var _secret : String as Secret

}
