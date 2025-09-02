package edge.oauth.authplugin

uses com.nimbusds.jose.JOSEException
uses com.nimbusds.jose.JWSAlgorithm
uses com.nimbusds.jose.jwk.source.JWKSource
uses com.nimbusds.jose.jwk.source.RemoteJWKSet
uses com.nimbusds.jose.proc.BadJOSEException
uses com.nimbusds.jose.util.DefaultResourceRetriever
uses com.nimbusds.jwt.JWTClaimsSet
uses com.nimbusds.jwt.proc.ConfigurableJWTProcessor
uses com.nimbusds.jwt.proc.DefaultJWTProcessor
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.di.annotations.ForAllGwNodes
uses edge.oauth.authplugin.config.OktaOAuthConfig
uses edge.oauth.authplugin.dto.JwtInitializationException
uses edge.oauth.authplugin.dto.JwtProcessingException

uses java.net.MalformedURLException
uses java.net.URL
uses java.text.ParseException

class JwtVerificationPlugin implements IJwtVerficationPlugin {
  final private static var _logger = new Logger(Reflection.getRelativeName(JwtVerificationPlugin))


  private static var _jwtProcessor: ConfigurableJWTProcessor as readonly JWTProcessor = initialiseJwtProcessor()
  private static var _processorKeySeyURL: String

  @ForAllGwNodes
  construct() {}

  override public function verifyToken(token: String) : JWTClaimsSet {
    var serverUrl = ScriptParameters.AuthServerUrl
    var tokenUrl = serverUrl + ScriptParameters.AuthServerPublicKeysEndpoint;
    //if script parameters have changed, reinitialise
    if (_jwtProcessor == null || tokenUrl != _processorKeySeyURL) {
      _jwtProcessor = initialiseJwtProcessor()
    }

    try {
      return _jwtProcessor.process(token, null)
    } catch (pe : ParseException) {
      throw new JwtProcessingException(pe)
    } catch (be: BadJOSEException) {
      throw new JwtProcessingException(be)
    } catch (je: JOSEException) {
      throw new JwtProcessingException(je)
    }
  }

  private static function initialiseJwtProcessor(): ConfigurableJWTProcessor {
    var processor = new DefaultJWTProcessor()
    try {
      var keySource = getPublicKeys()

      var expectedJWSAlg = JWSAlgorithm.RS256
      var keySelector = new JWSKeySelector(expectedJWSAlg, keySource)
      processor.setJWSKeySelector(keySelector)
    } catch (e: java.text.ParseException){
      throw new JwtInitializationException(e)
    } catch (e: MalformedURLException) {
      throw new JwtInitializationException(e)
    }
    return processor
  }

  private static function getPublicKeys(): JWKSource {
    var serverUrl = ScriptParameters.AuthServerUrl
    var tokenKeysUrlStr = serverUrl + ScriptParameters.AuthServerPublicKeysEndpoint

    var resourceRetriever = new DefaultResourceRetriever(
        OktaOAuthConfig.JWTAuthenticationConnectionTimeout,
        OktaOAuthConfig.JWTAuthenticationReadTimeout
    )

    _processorKeySeyURL =  tokenKeysUrlStr
    var tokenKeysUrl = new URL(tokenKeysUrlStr)
    return new RemoteJWKSet(tokenKeysUrl, resourceRetriever)
  }

}
