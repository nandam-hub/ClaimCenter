package edge.oauth.authplugin

uses com.nimbusds.jwt.JWTClaimsSet

interface IJwtVerficationPlugin {

  function verifyToken(token: String): JWTClaimsSet

}
