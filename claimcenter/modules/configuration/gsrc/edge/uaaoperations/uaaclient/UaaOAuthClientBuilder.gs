package edge.uaaoperations.uaaclient

uses com.fasterxml.jackson.core.JsonFactory
uses com.fasterxml.jackson.databind.ObjectMapper
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.exception.ApplicationErrorCode
uses edge.servlet.jsonrpc.marshalling.GosuModule
uses edge.uaaoperations.uaaclient.dto.TokenRequestDTO
uses edge.uaaoperations.uaaclient.dto.TokenResponseDTO
uses edge.uaaoperations.uaaclient.dto.UaaClientConfigDTO
uses org.apache.http.HttpHeaders
uses org.apache.http.HttpResponse
uses org.apache.http.HttpStatus
uses org.apache.http.NameValuePair
uses org.apache.http.ParseException
uses org.apache.http.client.entity.UrlEncodedFormEntity
uses org.apache.http.client.methods.HttpDelete
uses org.apache.http.client.methods.HttpGet
uses org.apache.http.client.methods.HttpPost
uses org.apache.http.client.methods.HttpPut
uses org.apache.http.client.methods.HttpRequestBase
uses org.apache.http.entity.ContentType
uses org.apache.http.entity.StringEntity
uses org.apache.http.impl.client.HttpClients
uses org.apache.http.message.BasicNameValuePair
uses org.apache.http.util.EntityUtils

uses java.io.IOException
uses java.io.StringWriter
uses java.lang.Class
uses java.lang.Exception
uses org.apache.commons.codec.binary.Base64
uses edge.uaaoperations.dto.UaaErrorResponseDTO
uses java.util.ArrayList
uses gw.lang.reflect.ReflectUtil
uses com.fasterxml.jackson.annotation.JsonInclude
uses com.fasterxml.jackson.databind.DeserializationFeature

/**
 * Helper class for making oauth client requests to UAA
 */
class UaaOAuthClientBuilder {

  static class UaaConnection {
    final private static var _logger = new Logger(Reflection.getRelativeName(UaaConnection))

    private static var TOKEN_PATH = "/oauth/token"

    private var _uaaClientConfig: UaaClientConfigDTO
    private var _accessToken: String
    private var _mapper: ObjectMapper

    construct() {
      setupMapper()
    }

    construct(uaaClientConfig: UaaClientConfigDTO, setAccessToken: Boolean) {
      setupMapper()
      _uaaClientConfig = uaaClientConfig
      if(setAccessToken)
        setAccessToken()
    }

    function setupMapper(){
      _mapper = new ObjectMapper()
      _mapper.registerModule(GosuModule.INSTANCE)
      this._mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL)
      this._mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
    }

    reified function httpGet<RespDTO>(path: String): RespDTO {
      var getRequest = new HttpGet(ScriptParameters.AuthServerUrl + path)
      requestAccessTokenIfNotSet(getRequest)
      return send<RespDTO>(getRequest)
    }

    reified function httpPut<ReqDTO, RespDTO>(path: String, putBody: ReqDTO) : RespDTO {
      var putRequest = new HttpPut(ScriptParameters.AuthServerUrl + path)
      requestAccessTokenIfNotSet(putRequest)
      putRequest.addHeader(HttpHeaders.IF_MATCH, "*")
      if(putRequest.Entity == null) {
        //default to content-type of application/json
        var jsonStr = writeValueAsString(putBody)
        var requestEntity = new StringEntity(jsonStr,ContentType.APPLICATION_JSON)
        putRequest.setEntity(requestEntity)
      }
      return send<RespDTO>(putRequest)
    }

    reified function httpPost<ReqDTO, RespDTO>(path: String, postBody: ReqDTO) : RespDTO {
      var postRequest = new HttpPost(ScriptParameters.AuthServerUrl + path)
      return httpPost<ReqDTO, RespDTO>(postRequest, postBody)
    }


    reified function httpPost<ReqDTO, RespDTO>(postRequest: HttpPost, postBody: ReqDTO) : RespDTO {
      requestAccessTokenIfNotSet(postRequest)
      if(postRequest.Entity == null) {
        //default to content-type of application/json
        var jsonStr = writeValueAsString(postBody)
        var requestEntity = new StringEntity(jsonStr, ContentType.APPLICATION_JSON)
        postRequest.setEntity(requestEntity)
      }
      return send<RespDTO>(postRequest)
    }

    reified function httpPostBasicAuth<ReqDTO, RespDTO>(path: String, postBody: String) : RespDTO {
      var encodedString = (new Base64()).encodeAsString(new String(_uaaClientConfig.ClientId + ":" + _uaaClientConfig.Secret).getBytes());
      var postRequest = new HttpPost(ScriptParameters.AuthServerUrl + path)
      postRequest.setHeader("Authorization", "Basic " + encodedString)
      postRequest.addHeader("Content-Type", ContentType.APPLICATION_FORM_URLENCODED as String)
      var urlParameters = new ArrayList<NameValuePair>()
      urlParameters.add(new BasicNameValuePair("token", postBody))
      postRequest.setEntity(new UrlEncodedFormEntity(urlParameters))

      return send<RespDTO>(postRequest)
    }


    reified function httpDelete<RespDTO>(path: String) : RespDTO {
      var deleteRequest = new HttpDelete(ScriptParameters.AuthServerUrl + path)
      requestAccessTokenIfNotSet(deleteRequest)
      return send<RespDTO>(deleteRequest)
    }

    private reified function send<RespDTO>(req: HttpRequestBase) : RespDTO {
      return send<RespDTO>(req, false);
    }

    private reified function send<RespDTO>(req: HttpRequestBase, isRetry: boolean) : RespDTO {
      // create HTTP Client
      var httpClient = HttpClients.createDefault()

      req.addHeader(HttpHeaders.ACCEPT, "application/json")

      var resp: RespDTO
      try {
        resp = httpClient.execute(req, \ httpResp: HttpResponse -> {
          var retVal : RespDTO
          var status = httpResp.StatusLine.StatusCode

          if (status == HttpStatus.SC_OK || status == HttpStatus.SC_CREATED) {
            return deserializeResponse<RespDTO>(httpResp)
          } else {
            _logger.logError("Error response from UAA: ${httpResp.toString()}")
            var errorCode : ApplicationErrorCode
            if (status == HttpStatus.SC_BAD_REQUEST)  {
              errorCode = ApplicationErrorCode.GW_UAA_CONNECTION_ERROR  //400 response
              try {
                var errorResponse = deserializeResponse<UaaErrorResponseDTO>(httpResp)
                _logger.logError("Error details from UAA: ${errorResponse.error_description}")
              } catch (e: Exception) {
                //if there is an exception here just continue. It'll be thrown later on
              }
            }
            if (status == HttpStatus.SC_CONFLICT) {
              errorCode = ApplicationErrorCode.GW_UAA_CONFLICT_ERROR //409
            }
            if (status == HttpStatus.SC_NOT_FOUND) {
              errorCode = ApplicationErrorCode.GW_UAA_CONNECTION_ERROR //404 response
            }
            if (status == HttpStatus.SC_UNAUTHORIZED) {
              errorCode = ApplicationErrorCode.GW_UAA_AUTHORIZATION_ERROR   //401 response
            }
            if (status == HttpStatus.SC_BAD_GATEWAY ||
                status ==  HttpStatus.SC_GATEWAY_TIMEOUT ||
                status == HttpStatus.SC_REQUEST_TIMEOUT
            ) {
              errorCode = ApplicationErrorCode.GW_UAA_CONNECTION_ERROR
            }
            if (errorCode == ApplicationErrorCode.GW_UAA_AUTHORIZATION_ERROR and !isRetry) {
              //token may have become invalid, (UAA may have been restarted for example) try get a new token
              _accessToken = null;
              setAccessToken()
              requestAccessTokenIfNotSet(req)
              return send<RespDTO>(req, true)
            } else {
              //other server errors we will return as 500
              throw new UaaConnectionException(errorCode){
                  : Message = "Error connecting to UAA, status code ${status}"
              }
            }

          }
        })
      } catch (e: UaaConnectionException) {
        throw e
      } catch (e: Exception) {
        throw new UaaConnectionException(ApplicationErrorCode.GW_UAA_CONNECTION_ERROR, e) { :Message = e.Message }
      } finally {
        httpClient.close()
      }
      return resp
    }

    private function setAccessToken() {
      if(_uaaClientConfig != null){
        var tokenReqDto = new TokenRequestDTO(_uaaClientConfig.ClientId, _uaaClientConfig.Secret)
        var postRequest = new HttpPost(ScriptParameters.AuthServerUrl + TOKEN_PATH)
        postRequest.addHeader("Content-Type", ContentType.APPLICATION_FORM_URLENCODED as String)
        var urlParameters = new ArrayList<NameValuePair>()
        urlParameters.add(new BasicNameValuePair("client_id", _uaaClientConfig.ClientId))
        urlParameters.add(new BasicNameValuePair("client_secret", _uaaClientConfig.Secret))
        urlParameters.add(new BasicNameValuePair("response_type", "token"))
        urlParameters.add(new BasicNameValuePair("grant_type", "client_credentials"))

        postRequest.setEntity(new UrlEncodedFormEntity(urlParameters))
        var respDto: TokenResponseDTO
        respDto = send<TokenResponseDTO>(postRequest)
        _accessToken = respDto.access_token
      }
    }

    private function requestAccessTokenIfNotSet(req: HttpRequestBase) {
      if (_accessToken == null) {
        setAccessToken()
      }
      if (_accessToken != null) {
        //set token as Authorization header
        req.setHeader("Authorization", "Bearer ${_accessToken}")
      }
    }

    private function writeValueAsString( object: Object) : String {
      var retJsonStr:String = null
      final var writer = new StringWriter()
      final var generator = new JsonFactory().createGenerator(writer)
      try {
        _mapper.writeValue(generator, object)
      } finally {
        generator.close()
        writer.close()
      }
      return writer.toString()
    }

    private reified function deserializeResponse<RespDTO>(httpResp: HttpResponse) : RespDTO{
      var entityStr = EntityUtils.toString(httpResp.Entity)
      if (entityStr != null) {
        try {
          return _mapper.readValue<RespDTO>(entityStr, (ReflectUtil.getClass(RespDTO.Type.Name).BackingClass) as Class<RespDTO>)
        } catch (e: ParseException) {
          throw new UaaConnectionException(ApplicationErrorCode.GW_UAA_RESPONSE_PROCESSING_ERROR, e)
        } catch (e: IOException) {
          throw new UaaConnectionException(ApplicationErrorCode.GW_UAA_RESPONSE_PROCESSING_ERROR, e)
        }
      }
      return null
    }
  }

  static function getUAAConnection(client: String, setAccessToken: Boolean) : UaaConnection {
    var clientConfig = new UaaClientConfigDTO(client)
    return new UaaConnection(clientConfig, setAccessToken)
  }

}
