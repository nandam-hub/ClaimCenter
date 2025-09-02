package edge.Plugin.pcintegration.authorization

uses com.fasterxml.jackson.databind.ObjectMapper
uses com.thetransactioncompany.jsonrpc2.JSONRPC2Request
uses com.thetransactioncompany.jsonrpc2.JSONRPC2Response
uses com.thetransactioncompany.jsonrpc2.client.JSONRPC2Session
uses com.thetransactioncompany.jsonrpc2.client.JSONRPC2SessionException
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.security.authorization.EdgeAuthorizationDTO
uses gw.api.suite.GuidewireSuiteUtil
uses net.minidev.json.JSONObject

uses java.net.MalformedURLException
uses java.net.URL
uses java.util.UUID
uses com.google.common.collect.ImmutableList
uses java.util.ArrayList
uses java.lang.IllegalArgumentException

class EdgeAuthorizationAPI {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(EdgeAuthorizationAPI))
  final private static  var _mapper = new ObjectMapper()
  private static var _pcURL = GuidewireSuiteUtil.getProductInfo("pc").getUrl()
  private static var _endpoint = "/service/edge/authorization/authorization"

  private var _token: String as Token
  private var _userContext: String as UserContext

  construct(token: String, userContext: String) {
    _token = token
    _userContext = userContext
  }

  public function isAuthorized(userName : String, entityType : String, entityID : String) : boolean {
    var session = getSession()

    var method = "isAuthorized"
    var id = UUID.randomUUID().toString()
    var paramsList = ImmutableList.of<Object>(userName, entityType, entityID)

    try {
      var request = new JSONRPC2Request(method, paramsList, id);
      var response = session.send(request)

      if (response.indicatesSuccess()) {
        return response.getResult() as boolean
      }
    } catch(ex : JSONRPC2SessionException) {
      LOGGER.logError("Authorization Request failed", ex)
      throw new JSONRPC2SessionException(ex.LocalizedMessage)
    }

    return false
  }

  public function getAuthorizationsForEntities(userName : String, entityType : String, entityIDs : String[]) : List<EdgeAuthorizationDTO> {
    var session = getSession()

    var method = "getAuthorizationsForEntities"
    var id = UUID.randomUUID().toString()
    var paramsList = ImmutableList.of<Object>(userName, entityType, entityIDs)

    try {
      var request = new JSONRPC2Request(method, paramsList, id);
      var response = session.send(request)
      if (response.indicatesSuccess()) {
        return mapResults(response)
      }
    } catch(ex : JSONRPC2SessionException) {
      LOGGER.logError("Authorization Request failed", ex)
      throw new JSONRPC2SessionException(ex.LocalizedMessage)
    }

    return new ArrayList<EdgeAuthorizationDTO>()
  }

  public function isAuthorizedForPolicy(userName : String, policyNumber : String) : boolean {
    var session = getSession()

    var method = "isAuthorizedForPolicy"
    var id = UUID.randomUUID().toString()
    var paramsList = ImmutableList.of<Object>(userName, policyNumber)

    try {
      var request = new JSONRPC2Request(method, paramsList, id);
      var response = session.send(request)
      if (response.indicatesSuccess()) {
        return response.getResult() as boolean
      }
    } catch(ex : JSONRPC2SessionException) {
      LOGGER.logError("Authorization Request failed", ex)
      throw new JSONRPC2SessionException(ex.LocalizedMessage)
    }

    return false
  }

  public function getAuthorizationsForPolicies(userName : String, policyNumbers : String[]) : List<EdgeAuthorizationDTO> {
    var session = getSession()

    var method = "getAuthorizationsForPolicies"
    var id = UUID.randomUUID().toString()
    var paramsList = ImmutableList.of<Object>(userName, policyNumbers)

    try {
      var request = new JSONRPC2Request(method, paramsList, id);
      var response = session.send(request)
      if (response.indicatesSuccess()) {
        return mapResults(response)
      }
    } catch(ex : JSONRPC2SessionException) {
      LOGGER.logError("Authorization Request failed", ex)
      throw new JSONRPC2SessionException(ex.LocalizedMessage)
    }

    return new ArrayList<EdgeAuthorizationDTO>()
  }

  protected function getSession() : JSONRPC2Session {
    // The JSON-RPC 2.0 server URL
    var serverURL : URL

    try {
      serverURL = new URL(_pcURL + _endpoint)
    } catch (ex : MalformedURLException) {
      LOGGER.logError("URL Format not supported", ex)
      throw new IllegalArgumentException("URL Format not supported")
    }

    var session = new JSONRPC2Session(serverURL)
    session.setConnectionConfigurator(new EdgeBearerPCAuthenticator(_token, _userContext))

    return session
  }

  protected function mapResults(response : JSONRPC2Response) : List<EdgeAuthorizationDTO> {
    var results = response.getResult() as List<JSONObject>

    return results.map(\ json -> _mapper.readValue(json.toString(), EdgeAuthorizationDTO))
  }

}
