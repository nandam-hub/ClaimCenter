package edge.oauth.authplugin

uses com.nimbusds.jose.Algorithm
uses com.nimbusds.jose.JWSHeader
uses com.nimbusds.jose.jwk.JWKMatcher
uses com.nimbusds.jose.proc.JWSVerificationKeySelector
uses com.nimbusds.jose.JWSAlgorithm
uses com.nimbusds.jose.jwk.source.JWKSource
uses com.nimbusds.jose.jwk.KeyType
uses com.nimbusds.jose.jwk.KeyUse

class JWSKeySelector extends JWSVerificationKeySelector {

  construct(jwsAlg: JWSAlgorithm, jwkSourceArg: JWKSource) {
    super(jwsAlg, jwkSourceArg)
  }


  override function createJWKMatcher(jwsHeader: JWSHeader): JWKMatcher {

    if (this.getExpectedJWSAlgorithm() != jwsHeader.getAlgorithm()) {
      return null
    }
    return new JWKMatcher.Builder()
        .keyType(KeyType.forAlgorithm(this.getExpectedJWSAlgorithm()))
        .keyID(jwsHeader.getKeyID())
        .keyUses(new KeyUse[]{KeyUse.SIGNATURE, null})
        .algorithms(new Algorithm[]{this.getExpectedJWSAlgorithm(), shaAlgorithm(), null})
        .build()
  }

  private function shaAlgorithm(): JWSAlgorithm {
    var signatureAlgorithm = this.getExpectedJWSAlgorithm()
    if (JWSAlgorithm.RS256 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA256withRSA")
    } else if (JWSAlgorithm.RS384 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA384withRSA")
    } else if (JWSAlgorithm.RS512 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA512withRSA")
    } else if (JWSAlgorithm.HS256 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA256withHMAC")
    } else if (JWSAlgorithm.HS384 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA384withHMAC")
    } else if (JWSAlgorithm.HS512 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA512withHMAC")
    } else if (JWSAlgorithm.ES256 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA256withEC")
    } else if (JWSAlgorithm.ES384 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA384withEC")
    } else if (JWSAlgorithm.ES512 == signatureAlgorithm) {
      return new JWSAlgorithm("SHA512withEC")
    }
    return signatureAlgorithm
  }
}
